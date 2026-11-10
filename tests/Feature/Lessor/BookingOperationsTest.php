<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use App\Models\User;
use App\Notifications\BookingChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->storefront = Storefront::factory()->onPlan()->create();
    $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create(['daily_rate' => 200000, 'deposit_percent' => 100]);
    $this->booking = Booking::factory()->for($this->car)->confirmed()
        ->between(today()->addDays(3)->toDateString(), today()->addDays(5)->toDateString())
        ->create(['daily_rate' => 200000, 'subtotal' => 400000, 'total' => 400000, 'security_deposit' => 500000]);
    $this->actingAs($this->storefront->owner);
});

describe('changing a booking', function () {
    test('an owner extends a booking: repriced, logged, and the renter is emailed', function () {
        Notification::fake();

        $this->put(route('lessor.bookings.trip.update', $this->booking), [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(7)->toDateString(),
        ])->assertSessionHasNoErrors();

        expect($this->booking->fresh())
            ->end_date->toDateString()->toBe(today()->addDays(7)->toDateString())
            ->total->toBe(800000)
            ->and($this->booking->events()->latest('id')->first()->action)->toBe('changed');
        Notification::assertSentOnDemand(BookingChanged::class);
    });

    test('a change can\'t clash with another booking, but can keep its own dates', function () {
        Booking::factory()->for($this->car)->confirmed()
            ->between(today()->addDays(6)->toDateString(), today()->addDays(8)->toDateString())->create();

        $this->put(route('lessor.bookings.trip.update', $this->booking), [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(7)->toDateString(),
        ])->assertSessionHasErrors('start_date');

        $this->put(route('lessor.bookings.trip.update', $this->booking), [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(6)->toDateString(),
        ])->assertSessionHasNoErrors();
    });

    test('changes follow the owner\'s booking rules unless they allow it anyway', function () {
        $this->storefront->update(['min_rental_days' => 3]);
        $change = [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(4)->toDateString(),
        ];

        $this->put(route('lessor.bookings.trip.update', $this->booking), $change)
            ->assertSessionHasErrors(['ignore_rules' => 'Your shortest rental is 3 days. Tick "Allow anyway" to save it.']);

        $this->put(route('lessor.bookings.trip.update', $this->booking), [...$change, 'ignore_rules' => true])
            ->assertSessionHasNoErrors();

        expect($this->booking->fresh()->end_date->toDateString())->toBe(today()->addDays(4)->toDateString());
    });

    test('finished bookings can\'t be changed', function () {
        $this->booking->update(['status' => BookingStatus::Completed]);

        $this->put(route('lessor.bookings.trip.update', $this->booking), [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(6)->toDateString(),
        ])->assertForbidden();
    });
});

describe('extra charges', function () {
    test('charges add to the total, show in the history, and can be removed', function () {
        $this->post(route('lessor.bookings.charges.store', $this->booking), ['label' => 'Late return', 'amount' => 1500])
            ->assertSessionHasNoErrors();

        $booking = $this->booking->fresh();
        expect($booking)->charges_total->toBe(150000)->total->toBe(550000)
            ->and($booking->events()->latest('id')->first())->action->toBe('charged');

        $this->delete(route('lessor.bookings.charges.destroy', [$booking, $booking->charges()->sole()]));

        expect($booking->fresh())->charges_total->toBe(0)->total->toBe(400000);
    });

    test('charges survive a date change', function () {
        $this->post(route('lessor.bookings.charges.store', $this->booking), ['label' => 'Cleaning', 'amount' => 500]);

        $this->put(route('lessor.bookings.trip.update', $this->booking), [
            'car' => $this->car->slug,
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(4)->toDateString(),
        ]);

        expect($this->booking->fresh()->total)->toBe(200000 + 50000);
    });
});

describe('deposit', function () {
    test('an owner collects the deposit, then returns part of it with a reason', function () {
        $this->put(route('lessor.bookings.deposit.update', $this->booking), ['action' => 'collected']);
        expect($this->booking->fresh()->deposit_collected_at)->not->toBeNull();

        $this->put(route('lessor.bookings.deposit.update', $this->booking), ['action' => 'returned', 'returned_amount' => 4000])
            ->assertSessionHasErrors(['note' => 'Say why part of the deposit was kept.']);

        $this->put(route('lessor.bookings.deposit.update', $this->booking), ['action' => 'returned', 'returned_amount' => 4000, 'note' => 'Scratched bumper'])
            ->assertSessionHasNoErrors();

        expect($this->booking->fresh())
            ->deposit_returned_amount->toBe(400000)
            ->deposit_note->toBe('Scratched bumper');
    });

    test('returning it in full needs no reason', function () {
        $this->put(route('lessor.bookings.deposit.update', $this->booking), ['action' => 'returned', 'returned_amount' => 5000])
            ->assertSessionHasNoErrors();

        expect($this->booking->fresh())->deposit_returned_amount->toBe(500000)->deposit_note->toBeNull();
    });
});

describe('pickup and return checks', function () {
    test('an owner records both checks with photos, privately', function () {
        Storage::fake('local');

        $this->post(route('lessor.bookings.inspections.store', $this->booking), [
            'type' => 'pickup', 'fuel_level' => 8, 'odometer' => 42000,
            'photos' => [UploadedFile::fake()->image('front.jpg'), UploadedFile::fake()->image('back.jpg')],
        ])->assertSessionHasNoErrors();
        $this->post(route('lessor.bookings.inspections.store', $this->booking), [
            'type' => 'return', 'fuel_level' => 5, 'odometer' => 42380, 'notes' => 'Small scratch on the door',
        ])->assertSessionHasNoErrors();

        $pickup = $this->booking->inspections()->where('type', 'pickup')->sole();
        expect($pickup->photos)->toHaveCount(2)
            ->and($this->booking->inspections()->count())->toBe(2);
        $this->get(route('lessor.bookings.inspections.photo', [$this->booking, $pickup, 1]))->assertOk();

        $this->actingAs(User::factory()->create())
            ->get(route('lessor.bookings.inspections.photo', [$this->booking, $pickup, 0]))
            ->assertForbidden();
    });
});

describe('down payment', function () {
    test('bank transfer renters owe only the down payment when the owner asks for one', function () {
        Notification::fake();
        $this->storefront->update(['accepts_bank_transfer' => true, 'down_payment_enabled' => true, 'down_payment_percent' => 30]);
        auth()->logout();

        $this->post(route('cars.bookings.store', $this->car), [
            'start_date' => today()->addDays(10)->toDateString(),
            'end_date' => today()->addDays(13)->toDateString(),
            'renter_name' => 'Juan Dela Cruz',
            'renter_email' => 'juan@example.com',
            'renter_phone' => '09171234567',
            'renter_license_number' => 'N01',
            'payment_method' => PaymentMethod::BankTransfer->value,
            'accepted_terms' => '1',
        ])->assertSessionHasNoErrors();

        $booking = Booking::latest('id')->first();
        expect($booking)->total->toBe(600000)->down_payment->toBe(180000)
            ->and($booking->transferAmount())->toBe(180000)
            ->and($booking->balanceDue())->toBe(600000);
    });

    test('an owner turns the down payment on and sets the percent', function () {
        $this->put(route('lessor.payments.update'), [
            'accepts_pay_at_pickup' => '1',
            'transfer_deadline_minutes' => 60,
            'down_payment_enabled' => '1',
            'down_payment_percent' => 40,
        ])->assertSessionHasNoErrors();

        expect($this->storefront->fresh())->down_payment_enabled->toBeTrue()->down_payment_percent->toBe(40);

        $this->put(route('lessor.payments.update'), [
            'accepts_pay_at_pickup' => '1',
            'transfer_deadline_minutes' => 60,
            'down_payment_enabled' => '1',
            'down_payment_percent' => 95,
        ])->assertSessionHasErrors('down_payment_percent');
    });
});
