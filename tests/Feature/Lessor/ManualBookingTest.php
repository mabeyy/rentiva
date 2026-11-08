<?php

use App\Enums\BookingSource;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Notifications\BookingRequested;
use App\Notifications\BookingStatusChanged;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

/**
 * @return array<string, mixed>
 */
function manualBooking(Car $car, array $overrides = []): array
{
    return [
        'car' => $car->slug,
        'start_date' => today()->addDays(2)->toDateString(),
        'end_date' => today()->addDays(4)->toDateString(),
        'renter_name' => 'Maria Santos',
        'renter_phone' => '09181234567',
        'source' => BookingSource::Phone->value,
        'payment_method' => 'pickup',
        ...$overrides,
    ];
}

beforeEach(function () {
    Notification::fake();
    $this->storefront = Storefront::factory()->onPlan()->create();
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create(['daily_rate' => 200000]);
});

test('an owner adds a phone booking: confirmed, priced, and logged', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car, ['is_paid' => '1']))
        ->assertSessionHasNoErrors();

    $booking = Booking::sole();
    expect($booking)
        ->status->toBe(BookingStatus::Confirmed)
        ->source->toBe(BookingSource::Phone)
        ->renter_email->toBeNull()
        ->total->toBe(400000)
        ->payment_status->toBe(PaymentStatus::Paid)
        ->and($booking->events()->sole()->action)->toBe('added');
    Notification::assertNotSentTo($this->storefront->owner, BookingRequested::class);
    Notification::assertNothingSentTo(new AnonymousNotifiable);
});

test('a renter email gets the confirmation', function () {
    $this->actingAs($this->storefront->owner)
        ->post(route('lessor.bookings.store'), manualBooking($this->car, ['renter_email' => 'maria@example.com']));

    Notification::assertSentOnDemand(BookingStatusChanged::class);
});

test('manual bookings can\'t clash with other bookings or use someone else\'s car', function () {
    Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(3)->toDateString(), today()->addDays(6)->toDateString())->create();
    $this->actingAs($this->storefront->owner);

    $this->post(route('lessor.bookings.store'), manualBooking($this->car))
        ->assertSessionHasErrors(['start_date' => 'This car is already booked for some of those dates.']);
    $this->post(route('lessor.bookings.store'), manualBooking(Car::factory()->create()))
        ->assertSessionHasErrors(['car' => 'Choose one of your cars.']);

    expect(Booking::count())->toBe(1);
});
