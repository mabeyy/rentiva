<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingCharge;
use App\Models\Car;
use App\Models\Storefront;
use App\Notifications\BookingStatusChanged;
use App\Notifications\PaymentReviewed;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

beforeEach(function () {
    Notification::fake();
    $this->storefront = Storefront::factory()->onPlan()->create(['pickup_time' => '09:00', 'min_rental_days' => 1, 'advance_notice_hours' => 0, 'max_advance_days' => 180]);
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create();
});

test('requests the owner doesn\'t answer in 48 hours, or before pickup, expire and free the dates', function () {
    $stale = Booking::factory()->for($this->car)->between(today()->addDays(10)->toDateString(), today()->addDays(12)->toDateString())->create(['created_at' => now()->subHours(49)]);
    $pickupPassed = Booking::factory()->for($this->car)->between(today()->subDay()->toDateString(), today()->addDay()->toDateString())->create();
    $fresh = Booking::factory()->for($this->car)->between(today()->addDays(20)->toDateString(), today()->addDays(22)->toDateString())->create();

    $this->artisan('bookings:expire-pending')->assertSuccessful();

    expect($stale->fresh()->status)->toBe(BookingStatus::Declined)
        ->and($stale->fresh()->decline_reason)->toContain('expired')
        ->and($pickupPassed->fresh()->status)->toBe(BookingStatus::Declined)
        ->and($fresh->fresh()->status)->toBe(BookingStatus::Pending);
    Notification::assertSentOnDemandTimes(BookingStatusChanged::class, 2);
});

test('a renter can only ask for dates the owner could accept, and can withdraw the request', function () {
    $booking = Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(5)->toDateString(), today()->addDays(7)->toDateString())->create();
    Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(20)->toDateString(), today()->addDays(23)->toDateString())->create();
    $url = URL::signedRoute('bookings.change-request.store', $booking);

    $this->post($url, ['start_date' => today()->addDays(21)->toDateString(), 'end_date' => today()->addDays(24)->toDateString()])
        ->assertSessionHasErrors(['start_date' => "The car isn't free for some of those dates. Try others."]);
    $this->post($url, ['start_date' => today()->addDays(200)->toDateString(), 'end_date' => today()->addDays(202)->toDateString()])
        ->assertSessionHasErrors(['start_date' => 'Bookings open 180 days ahead.']);

    $this->post($url, ['start_date' => today()->addDays(8)->toDateString(), 'end_date' => today()->addDays(10)->toDateString()])->assertSessionHasNoErrors();
    expect($booking->fresh()->change_request)->not->toBeNull();

    $this->delete(URL::signedRoute('bookings.change-request.destroy', $booking))->assertSessionHasNoErrors();
    expect($booking->fresh()->change_request)->toBeNull();
});

test('a change request can\'t be approved once the booking is cancelled', function () {
    $booking = Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(5)->toDateString(), today()->addDays(7)->toDateString())->create();
    $booking->forceFill(['change_request' => ['start_date' => today()->addDays(8)->toDateString(), 'end_date' => today()->addDays(10)->toDateString(), 'note' => null, 'requested_at' => now()->toIso8601String()]])->save();
    $this->actingAs($this->storefront->owner);

    $this->patch(route('lessor.bookings.update', $booking), ['status' => 'cancelled', 'reason' => 'The car was in an accident.'])->assertSessionHasNoErrors();

    expect($booking->fresh())->cancel_reason->toBe('The car was in an accident.')->change_request->toBeNull();
    $this->post(route('lessor.bookings.change-request.approve', $booking))->assertNotFound();
    Notification::assertSentOnDemand(BookingStatusChanged::class, fn (BookingStatusChanged $notification, array $channels, AnonymousNotifiable $notifiable): bool => in_array('Reason: The car was in an accident.', $notification->toMail($notifiable)->introLines, true));
});

test('a trip can\'t be marked completed before it starts', function () {
    $booking = Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(3)->toDateString(), today()->addDays(5)->toDateString())->create();

    $this->actingAs($this->storefront->owner)
        ->patch(route('lessor.bookings.update', $booking), ['status' => 'completed'])
        ->assertSessionHasErrors(['status' => 'A trip can only be marked completed once it has started.']);
});

test('what the renter paid stays put when charges or longer dates are added later', function () {
    $booking = Booking::factory()->for($this->car)->confirmed()->create(['payment_method' => PaymentMethod::BankTransfer, 'total' => 500000, 'subtotal' => 500000, 'discount' => 0, 'delivery_fee' => 0, 'driver_fee' => 0]);
    $booking->forceFill(['payment_status' => PaymentStatus::Submitted])->save();
    $this->actingAs($this->storefront->owner)->post(route('lessor.bookings.payment.approve', $booking));
    expect($booking->fresh()->amount_paid)->toBe(500000);

    BookingCharge::factory()->for($booking)->create(['amount' => 300000]);
    $booking = $booking->fresh();
    $booking->recalculateTotal();
    $booking->save();

    expect($booking->amountPaid())->toBe(500000)->and($booking->balanceDue())->toBe(300000)->and($booking->overpaid())->toBe(0);
});

test('a renter can\'t send a second request for the same car while one is waiting', function () {
    $request = [
        'start_date' => today()->addDays(10)->toDateString(),
        'end_date' => today()->addDays(12)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01',
        'accepted_terms' => '1',
    ];

    $this->post(route('cars.bookings.store', $this->car), $request)->assertSessionHasNoErrors();
    $this->post(route('cars.bookings.store', $this->car), [...$request, 'start_date' => today()->addDays(30)->toDateString(), 'end_date' => today()->addDays(32)->toDateString()])
        ->assertSessionHasErrors('renter_email');
});

test('an owner without a plan can\'t take online bookings yet', function () {
    $owner = Storefront::factory()->create()->owner;
    $car = Car::factory()->for($owner, 'owner')->create();

    $this->post(route('cars.bookings.store', $car), [
        'start_date' => today()->addDays(10)->toDateString(),
        'end_date' => today()->addDays(12)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01',
        'accepted_terms' => '1',
    ])->assertSessionHasErrors('start_date');

    expect(Booking::count())->toBe(0);
});

test('confirming a bank-transfer booking tells the renter what to send and by when', function () {
    $booking = Booking::factory()->for($this->car)->create(['payment_method' => PaymentMethod::BankTransfer]);

    $this->actingAs($this->storefront->owner)->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed']);

    Notification::assertSentOnDemand(BookingStatusChanged::class, function (BookingStatusChanged $notification, array $channels, AnonymousNotifiable $notifiable): bool {
        $mail = $notification->toMail($notifiable);

        return $mail->actionText === 'Pay now' && str_contains(implode(' ', $mail->introLines), 'If it isn\'t sent by then, the booking is cancelled');
    });
});

test('renters are emailed about their payment on every plan', function () {
    $starter = Storefront::factory()->onPlan(['features' => []])->create();
    $booking = Booking::factory()->for(Car::factory()->for($starter->owner, 'owner'))->confirmed()->create(['payment_method' => PaymentMethod::BankTransfer]);
    $booking->forceFill(['payment_status' => PaymentStatus::Submitted])->save();

    expect((new PaymentReviewed($booking))->via(new AnonymousNotifiable))->toBe(['mail']);
});
