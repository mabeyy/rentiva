<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Notifications\BookingStatusChanged;
use Illuminate\Support\Facades\Notification;

test('a lessor confirms a pending booking and the renter is notified', function () {
    Notification::fake();
    $booking = Booking::factory()->create();
    onFullPlan($booking->car->owner);

    $this->actingAs($booking->car->owner)
        ->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed'])
        ->assertSessionHasNoErrors();

    expect($booking->fresh())
        ->status->toBe(BookingStatus::Confirmed)
        ->confirmed_at->not->toBeNull();
    Notification::assertSentOnDemand(BookingStatusChanged::class);
});

test('declining a booking requires a reason that is stored for the renter', function () {
    Notification::fake();
    $booking = Booking::factory()->create();

    $this->actingAs($booking->car->owner)
        ->patch(route('lessor.bookings.update', $booking), ['status' => 'declined'])
        ->assertSessionHasErrors('reason');

    $this->patch(route('lessor.bookings.update', $booking), ['status' => 'declined', 'reason' => 'Under maintenance']);

    expect($booking->fresh())
        ->status->toBe(BookingStatus::Declined)
        ->decline_reason->toBe('Under maintenance');
});

test('a lessor cannot move a booking to a status it cannot reach', function () {
    $booking = Booking::factory()->completed()->create();

    $this->actingAs($booking->car->owner)
        ->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed'])
        ->assertSessionHasErrors(['status' => 'A completed booking cannot be marked as confirmed.']);
});

test('a lessor cannot change bookings on another lessor\'s car', function () {
    $booking = Booking::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed'])
        ->assertForbidden();

    expect($booking->fresh()->status)->toBe(BookingStatus::Pending);
});

test('the bookings list contains only bookings on the lessor\'s cars, filtered by status', function () {
    $lessor = User::factory()->create();
    $pending = Booking::factory()->for(Car::factory()->for($lessor, 'owner'))->create();
    Booking::factory()->confirmed()->for(Car::factory()->for($lessor, 'owner'))->create();
    Booking::factory()->create();

    $this->actingAs($lessor)
        ->get(route('lessor.bookings.index', ['status' => 'pending']))
        ->assertInertia(fn ($page) => $page
            ->component('lessor/bookings/index')
            ->has('bookings.data', 1)
            ->where('bookings.data.0.id', $pending->id));
});

test('the calendar shows the lessor\'s rentals in the visible month', function () {
    $this->travelTo('2026-11-07');
    $car = Car::factory()->create();
    $inMonth = Booking::factory()->for($car)->confirmed()->create(['start_date' => '2026-11-10', 'end_date' => '2026-11-13']);
    $spillsIn = Booking::factory()->for($car)->create(['start_date' => '2026-10-30', 'end_date' => '2026-11-02']);
    Booking::factory()->for($car)->cancelled()->create(['start_date' => '2026-11-15', 'end_date' => '2026-11-16']);
    Booking::factory()->for($car)->confirmed()->create(['start_date' => '2026-12-20', 'end_date' => '2026-12-22']);
    Booking::factory()->confirmed()->create(['start_date' => '2026-11-10', 'end_date' => '2026-11-12']);

    $this->actingAs($car->owner)
        ->get(route('lessor.bookings.calendar'))
        ->assertInertia(fn ($page) => $page
            ->component('lessor/bookings/calendar')
            ->where('selectedDate', '2026-11-07')
            ->has('bookings', 2)
            ->where('bookings.0.reference', $spillsIn->reference)
            ->where('bookings.1.reference', $inMonth->reference));
});

test('the calendar opens on a chosen day', function () {
    $car = Car::factory()->create();

    $this->actingAs($car->owner)
        ->get(route('lessor.bookings.calendar', ['date' => '2027-01-15']))
        ->assertInertia(fn ($page) => $page->where('selectedDate', '2027-01-15'));
});
