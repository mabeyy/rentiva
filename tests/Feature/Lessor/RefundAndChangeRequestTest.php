<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Notifications\BookingActivity;
use App\Notifications\BookingChanged;
use App\Notifications\ChangeRequestAnswered;
use App\Notifications\RefundRecorded;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

describe('refunds', function () {
    beforeEach(function () {
        Notification::fake();
        $this->booking = Booking::factory()->create([
            'status' => BookingStatus::Cancelled,
            'payment_method' => PaymentMethod::BankTransfer,
            'payment_status' => PaymentStatus::Paid,
            'total' => 600000,
        ]);
        onFullPlan($this->booking->car->owner);
        $this->actingAs($this->booking->car->owner);
    });

    test('a cancelled paid booking owes a refund until the owner records it', function () {
        expect($this->booking->needsRefund())->toBeTrue();

        $this->put(route('lessor.bookings.refund.update', $this->booking), ['amount' => 5000])
            ->assertSessionHasErrors(['note' => 'Say why part of the payment was kept.']);

        $this->put(route('lessor.bookings.refund.update', $this->booking), ['amount' => 5000, 'reference' => 'BDO-77', 'note' => 'Cancellation fee'])
            ->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        expect($booking)
            ->refund_amount->toBe(500000)
            ->refund_note->toBe('Cancellation fee')
            ->needsRefund()->toBeFalse()
            ->and($booking->events()->latest('id')->first()->action)->toBe('refunded');
        Notification::assertSentOnDemand(RefundRecorded::class);
    });

    test('active or unpaid bookings have nothing to refund', function () {
        $this->booking->update(['status' => BookingStatus::Confirmed]);

        $this->put(route('lessor.bookings.refund.update', $this->booking), ['amount' => 6000])->assertNotFound();
    });
});

describe('change requests', function () {
    beforeEach(function () {
        Notification::fake();
        $this->car = Car::factory()->create(['daily_rate' => 200000]);
        onFullPlan($this->car->owner);
        $this->booking = Booking::factory()->for($this->car)->confirmed()
            ->between(today()->addDays(5)->toDateString(), today()->addDays(7)->toDateString())
            ->create(['subtotal' => 400000, 'total' => 400000, 'daily_rate' => 200000]);
        $this->requestUrl = URL::signedRoute('bookings.change-request.store', $this->booking);
    });

    test('a renter asks for new dates; the owner sees it and approves', function () {
        $this->post($this->requestUrl, [
            'start_date' => today()->addDays(10)->toDateString(),
            'end_date' => today()->addDays(13)->toDateString(),
            'note' => 'Flight moved',
        ])->assertSessionHasNoErrors();

        $owner = $this->car->owner;
        expect($this->booking->fresh()->change_request['note'])->toBe('Flight moved');
        Notification::assertSentTo($owner, BookingActivity::class, fn (BookingActivity $alert) => $alert->event->action === 'change_requested');

        // One request at a time.
        $this->post($this->requestUrl, ['start_date' => today()->addDays(20)->toDateString(), 'end_date' => today()->addDays(21)->toDateString()])
            ->assertForbidden();

        $this->actingAs($owner)
            ->get(route('lessor.bookings.show', $this->booking))
            ->assertInertia(fn (Assert $page) => $page->where('booking.change_request.start_date', today()->addDays(10)->toDateString()));

        $this->post(route('lessor.bookings.change-request.approve', $this->booking))->assertSessionHasNoErrors();

        expect($this->booking->fresh())
            ->start_date->toDateString()->toBe(today()->addDays(10)->toDateString())
            ->total->toBe(600000)
            ->change_request->toBeNull();
        Notification::assertSentOnDemand(BookingChanged::class);
    });

    test('the owner declines with a reason the renter is emailed', function () {
        $this->post($this->requestUrl, ['start_date' => today()->addDays(10)->toDateString(), 'end_date' => today()->addDays(12)->toDateString()]);

        $this->actingAs($this->car->owner)
            ->post(route('lessor.bookings.change-request.decline', $this->booking), ['reason' => 'Booked those days'])
            ->assertSessionHasNoErrors();

        expect($this->booking->fresh()->change_request)->toBeNull()
            ->and($this->booking->fresh()->start_date->toDateString())->toBe(today()->addDays(5)->toDateString());
        Notification::assertSentOnDemand(ChangeRequestAnswered::class, fn (ChangeRequestAnswered $notification) => $notification->reason === 'Booked those days');
    });

    test('approving still checks the car is free', function () {
        $this->post($this->requestUrl, ['start_date' => today()->addDays(10)->toDateString(), 'end_date' => today()->addDays(12)->toDateString()]);
        Booking::factory()->for($this->car)->confirmed()->between(today()->addDays(11)->toDateString(), today()->addDays(14)->toDateString())->create();

        $this->actingAs($this->car->owner)
            ->post(route('lessor.bookings.change-request.approve', $this->booking))
            ->assertSessionHasErrors('start_date');
    });

    test('other owners can\'t answer the request', function () {
        $this->post($this->requestUrl, ['start_date' => today()->addDays(10)->toDateString(), 'end_date' => today()->addDays(12)->toDateString()]);

        $this->actingAs(User::factory()->create())
            ->post(route('lessor.bookings.change-request.approve', $this->booking))
            ->assertForbidden();
    });
});
