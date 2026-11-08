<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use Inertia\Testing\AssertableInertia as Assert;

test('a renter\'s request shows in the owner\'s bell, and opening it marks it read', function () {
    $car = Car::factory()->create();

    $this->post(route('cars.bookings.store', $car), [
        'start_date' => today()->addDays(3)->toDateString(),
        'end_date' => today()->addDays(5)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01-23-456789',
        'accepted_terms' => '1',
    ])->assertSessionHasNoErrors();

    $owner = $car->owner;
    $alert = $owner->notifications()->sole();
    expect($alert->data)->toMatchArray(['action' => 'requested', 'title' => 'New booking request']);

    $this->actingAs($owner)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('notifications.unread', 1)->where('notifications.items.0.title', 'New booking request'));

    $this->get(route('lessor.notifications.show', $alert->id))
        ->assertRedirect(route('lessor.bookings.show', Booking::sole(), absolute: false));

    expect($alert->fresh()->read_at)->not->toBeNull();
});

test('the owner\'s own actions don\'t notify them, and they can mark everything read', function () {
    $booking = Booking::factory()->create();
    $owner = $booking->car->owner;
    $this->actingAs($owner);

    $this->patch(route('lessor.bookings.update', $booking), ['status' => BookingStatus::Confirmed->value]);
    expect($owner->notifications()->count())->toBe(0);

    auth()->logout();
    $booking->recordEvent('cancelled');
    expect($owner->unreadNotifications()->count())->toBe(1);

    $this->actingAs($owner)->post(route('lessor.notifications.read'));
    expect($owner->unreadNotifications()->count())->toBe(0);
});
