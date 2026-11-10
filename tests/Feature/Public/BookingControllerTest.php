<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Notifications\BookingReceived;
use App\Notifications\BookingRequested;
use App\Notifications\BookingStatusChanged;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array<string, mixed>
 */
function bookingPayload(array $overrides = []): array
{
    return [
        'start_date' => today()->addDays(3)->toDateString(),
        'end_date' => today()->addDays(6)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'Juan@Example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01-23-456789',
        'accepted_terms' => '1',
        ...$overrides,
    ];
}

describe('store', function () {
    test('a guest can request a booking and both parties are notified', function () {
        Notification::fake();
        $car = Car::factory()->create(['daily_rate' => 250000]);
        onFullPlan($car->owner);

        $response = $this->post(route('cars.bookings.store', $car), bookingPayload());

        $booking = Booking::sole();
        expect($booking->status)->toBe(BookingStatus::Pending)
            ->and($booking->total)->toBe(750000)
            ->and($booking->daily_rate)->toBe(250000)
            ->and($booking->renter_email)->toBe('juan@example.com')
            ->and($booking->reference)->toStartWith('RNT-');
        $response->assertRedirect($booking->manageUrl());
        Notification::assertSentTo($car->owner, BookingRequested::class);
        Notification::assertSentOnDemand(
            BookingReceived::class,
            fn ($notification, array $channels, AnonymousNotifiable $notifiable) => array_key_exists('juan@example.com', $notifiable->routes['mail']),
        );
    });

    test('a request overlapping a pending or confirmed booking is rejected', function (BookingStatus $status) {
        Notification::fake();
        $car = Car::factory()->create();
        Booking::factory()->for($car)->between(
            today()->addDays(5)->toDateString(),
            today()->addDays(9)->toDateString(),
        )->create(['status' => $status]);

        $this->post(route('cars.bookings.store', $car), bookingPayload([
            'start_date' => today()->addDays(8)->toDateString(),
            'end_date' => today()->addDays(10)->toDateString(),
        ]))->assertSessionHasErrors(['start_date' => 'This car is already booked for some of those dates.']);

        expect(Booking::count())->toBe(1);
    })->with([
        'pending' => BookingStatus::Pending,
        'confirmed' => BookingStatus::Confirmed,
    ]);

    test('a request may start on the day another booking is returned', function () {
        Notification::fake();
        $car = Car::factory()->create();
        Booking::factory()->for($car)->confirmed()->between(
            today()->addDays(1)->toDateString(),
            today()->addDays(3)->toDateString(),
        )->create();

        $this->post(route('cars.bookings.store', $car), bookingPayload())->assertSessionHasNoErrors();

        expect(Booking::count())->toBe(2);
    });

    test('a car that is not listed cannot be booked', function () {
        $car = Car::factory()->suspended()->create();

        $this->post(route('cars.bookings.store', $car), bookingPayload())
            ->assertSessionHasErrors(['start_date' => 'This car is no longer available for booking.']);

        expect(Booking::count())->toBe(0);
    });

    test('a booking request requires renter details, valid dates and accepted terms', function () {
        $car = Car::factory()->create();

        $this->post(route('cars.bookings.store', $car), [])
            ->assertSessionHasErrors(['start_date', 'end_date', 'renter_name', 'renter_email', 'renter_phone', 'renter_license_number', 'accepted_terms']);
    });

    test('a booking request rejects invalid input', function (array $overrides, string $field, string $message) {
        $car = Car::factory()->create();

        $this->post(route('cars.bookings.store', $car), bookingPayload($overrides))
            ->assertSessionHasErrors([$field => $message]);
    })->with([
        'non-Philippine mobile number' => [['renter_phone' => '12345'], 'renter_phone', 'Enter a Philippine mobile number, e.g. 09171234567.'],
        'longer than 30 days' => [['end_date' => today()->addDays(40)->toDateString()], 'end_date', 'Bookings can be at most 30 days long.'],
        'start date in the past' => [['start_date' => today()->subDay()->toDateString()], 'start_date', 'The start date field must be a date after or equal to today.'],
        'return before pickup' => [['end_date' => today()->addDays(2)->toDateString()], 'end_date', 'The end date field must be a date after start date.'],
    ]);
});

describe('show', function () {
    test('the signed link shows the booking to the guest', function () {
        $booking = Booking::factory()->create();

        $this->get($booking->manageUrl())
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('booking.reference', $booking->reference)
                // Even before confirming, the renter can reach the owner.
                ->where('host.phone', $booking->car->owner->phone)
                ->whereNot('cancelUrl', null));
    });

    test('a booking is shown in its owner\'s branding', function () {
        $storefront = Storefront::factory()->create();
        $booking = Booking::factory()->for(Car::factory()->for($storefront->owner, 'owner'))->create();

        $this->get($booking->manageUrl())
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/booking')
                ->where('storefront.slug', $storefront->slug));
    });

    test('a booking whose owner has no booking page uses the plain page', function () {
        $booking = Booking::factory()->create();

        $this->get($booking->manageUrl())
            ->assertInertia(fn (Assert $page) => $page->component('bookings/show'));
    });

    test('the owner contact details are shared once the booking is confirmed', function () {
        $booking = Booking::factory()->confirmed()->create();

        $this->get($booking->manageUrl())
            ->assertInertia(fn (Assert $page) => $page->where('host.email', $booking->car->owner->email));
    });

    test('an unsigned booking link is rejected with 403', function () {
        $booking = Booking::factory()->create();

        $this->get(route('bookings.show', $booking))->assertForbidden();
    });
});

describe('destroy', function () {
    test('the guest can cancel through the signed link and is notified', function () {
        Notification::fake();
        $booking = Booking::factory()->confirmed()->create();
        onFullPlan($booking->car->owner);

        $this->delete(URL::signedRoute('bookings.destroy', $booking))
            ->assertRedirect($booking->manageUrl());

        expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled)
            ->and($booking->fresh()->cancelled_at)->not->toBeNull();
        Notification::assertSentOnDemand(BookingStatusChanged::class);
    });

    test('a completed booking cannot be cancelled', function () {
        $booking = Booking::factory()->completed()->create();

        $this->delete(URL::signedRoute('bookings.destroy', $booking))
            ->assertRedirect($booking->manageUrl());

        expect($booking->fresh()->status)->toBe(BookingStatus::Completed);
    });

    test('cancelling without a valid signature is rejected with 403', function () {
        $booking = Booking::factory()->create();

        $this->delete(route('bookings.destroy', $booking))->assertForbidden();

        expect($booking->fresh()->status)->toBe(BookingStatus::Pending);
    });
});
