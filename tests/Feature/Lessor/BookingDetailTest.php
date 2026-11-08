<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\RenterFlag;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('an owner opens a booking with its history, renter summary and flag', function () {
    $car = Car::factory()->create();
    $booking = Booking::factory()->for($car)->create(['renter_phone' => '+639171234567']);
    Booking::factory()->for($car)->completed()->create(['renter_phone' => '09171234567']);
    RenterFlag::factory()->for($car->owner, 'owner')->create(['phone_key' => '09171234567', 'note' => 'Late return']);
    $booking->recordEvent('requested');

    $this->actingAs($car->owner)
        ->get(route('lessor.bookings.show', $booking))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('lessor/bookings/show')
            ->where('booking.reference', $booking->reference)
            ->where('events.0.action', 'requested')
            ->where('renter.bookings_count', 2)
            ->where('renter.flag', 'Late return'));
});

test('other owners can\'t open the booking, its license or its documents', function () {
    $booking = Booking::factory()->create();
    $this->actingAs(User::factory()->create());

    $this->get(route('lessor.bookings.show', $booking))->assertForbidden();
    $this->get(route('lessor.bookings.license.show', $booking))->assertForbidden();
    $this->get(route('lessor.bookings.receipt', $booking))->assertForbidden();
    $this->get(route('lessor.bookings.agreement', $booking))->assertForbidden();
});

test('an owner views the license photo and marks it checked', function () {
    Storage::fake('local');
    $booking = Booking::factory()->create(['license_photo_path' => UploadedFile::fake()->image('license.jpg')->store('license-photos', 'local')]);
    $this->actingAs($booking->car->owner);

    $this->get(route('lessor.bookings.license.show', $booking))->assertOk();
    $this->put(route('lessor.bookings.license.update', $booking), ['checked' => true])->assertSessionHasNoErrors();

    expect($booking->fresh()->license_checked_at)->not->toBeNull()
        ->and($booking->events()->latest('id')->first()->action)->toBe('license_checked');
});

test('the receipt and agreement show the booking\'s details', function () {
    $booking = Booking::factory()->create(['subtotal' => 600000, 'discount' => 60000, 'total' => 540000, 'security_deposit' => 300000]);
    $this->actingAs($booking->car->owner);

    $this->get(route('lessor.bookings.receipt', $booking))
        ->assertOk()
        ->assertSee($booking->reference)
        ->assertSee('Long-stay discount')
        ->assertSee('₱5,400.00');

    $this->get(route('lessor.bookings.agreement', $booking))
        ->assertOk()
        ->assertSee('Rental agreement')
        ->assertSee($booking->renter_name)
        ->assertSee('₱3,000.00');
});
