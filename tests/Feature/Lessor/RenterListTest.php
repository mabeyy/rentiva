<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\RenterFlag;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('renters are grouped by mobile number however it was typed', function () {
    $car = Car::factory()->create();
    Booking::factory()->for($car)->create(['renter_phone' => '09171234567', 'status' => BookingStatus::Completed, 'total' => 300000]);
    Booking::factory()->for($car)->create(['renter_phone' => '+639171234567', 'status' => BookingStatus::Confirmed, 'total' => 200000]);
    Booking::factory()->for($car)->create(['renter_phone' => '09998887777']);
    Booking::factory()->create(['renter_phone' => '09171234567']);

    $this->actingAs($car->owner)
        ->get(route('lessor.renters.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('renters.data', 2)
            ->has('renters.meta.last_page')
            ->where('renters.data', fn ($rows) => collect($rows)->firstWhere('key', '09171234567')['bookings_count'] === 2
                && collect($rows)->firstWhere('key', '09171234567')['total_spent'] === 500000));

    $this->get(route('lessor.renters.show', '09171234567'))
        ->assertInertia(fn (Assert $page) => $page->component('lessor/renters/show')->has('bookings', 2));
});

test('an owner flags a renter privately and clears the flag', function () {
    $booking = Booking::factory()->create(['renter_phone' => '09171234567']);
    $owner = $booking->car->owner;
    $this->actingAs($owner);

    $this->put(route('lessor.renters.flag', '09171234567'), ['note' => 'Late and no fuel'])->assertSessionHasNoErrors();
    expect(RenterFlag::where('owner_id', $owner->id)->sole()->note)->toBe('Late and no fuel');

    $this->get(route('lessor.renters.index', ['flagged' => 1]))
        ->assertInertia(fn (Assert $page) => $page->has('renters.data', 1)->where('flaggedCount', 1));

    $this->put(route('lessor.renters.flag', '09171234567'), ['note' => '']);
    expect(RenterFlag::count())->toBe(0);
});

test('owners can only see and flag their own renters', function () {
    Booking::factory()->create(['renter_phone' => '09171234567']);
    $this->actingAs(User::factory()->create());

    $this->get(route('lessor.renters.show', '09171234567'))->assertNotFound();
    $this->put(route('lessor.renters.flag', '09171234567'), ['note' => 'x'])->assertNotFound();
});

test('bookings sharing an email count as one renter across different numbers, and a flag covers both', function () {
    $car = Car::factory()->create();
    Booking::factory()->for($car)->create(['renter_phone' => '09171234567', 'renter_email' => 'juan@gmail.com', 'start_date' => now()->subMonth()]);
    Booking::factory()->for($car)->create(['renter_phone' => '09281112222', 'renter_email' => 'Juan@Gmail.com', 'start_date' => now()]);
    $this->actingAs($car->owner);

    $this->get(route('lessor.renters.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('renters.data', 1)
            ->where('renters.data.0.key', '09281112222')
            ->where('renters.data.0.bookings_count', 2));

    $this->put(route('lessor.renters.flag', '09171234567'), ['note' => 'Unpaid tolls']);

    $this->get(route('lessor.renters.show', '09171234567'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('renter.flag', 'Unpaid tolls')
            ->where('renter.other_phones.0', '09171234567')
            ->has('bookings', 2));
});
