<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\PaymentAccount;
use App\Models\Storefront;
use App\Models\User;
use App\Notifications\PaymentReviewed;
use App\Notifications\PaymentSubmitted;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * An owner who accepts bank transfers, with a confirmed transfer booking.
 */
function transferBooking(array $attributes = []): Booking
{
    $storefront = Storefront::factory()->onPlan()->create(['accepts_bank_transfer' => true]);
    PaymentAccount::factory()->for($storefront)->create([
        'bank_name' => 'BDO',
        'account_name' => 'ABQ Car Rental',
        'account_number' => '0012 3456 7890',
    ]);

    return Booking::factory()
        ->for(Car::factory()->for($storefront->owner, 'owner'))
        ->confirmed()
        ->create(['payment_method' => PaymentMethod::BankTransfer, ...$attributes]);
}

function paymentUrl(Booking $booking): string
{
    return URL::signedRoute('bookings.payment.store', $booking);
}

describe('owner settings', function () {
    test('the transfers page queues submitted transfers, oldest first', function () {
        $newer = transferBooking(['payment_status' => PaymentStatus::Submitted, 'payment_submitted_at' => now()]);
        $older = transferBooking(['payment_status' => PaymentStatus::Submitted, 'payment_submitted_at' => now()->subHour()]);
        $older->car->forceFill(['owner_id' => $newer->car->owner_id])->save();
        transferBooking(['payment_status' => PaymentStatus::Paid]);

        $this->actingAs($newer->car->owner)
            ->get(route('lessor.transfers'))
            ->assertInertia(fn ($page) => $page
                ->component('lessor/transfers')
                ->where('counts.toCheck', 2)
                ->where('transfers.0.reference', $older->reference)
                ->where('transfers.1.reference', $newer->reference));
    });

    test('the transfer history lists paid and rejected transfers', function () {
        $paid = transferBooking(['payment_status' => PaymentStatus::Paid, 'payment_submitted_at' => now()]);
        transferBooking(['payment_status' => PaymentStatus::Submitted]);

        $this->actingAs($paid->car->owner)
            ->get(route('lessor.transfers', ['tab' => 'history']))
            ->assertInertia(fn ($page) => $page
                ->where('tab', 'history')
                ->has('transfers.data', 1)
                ->where('transfers.data.0.reference', $paid->reference));
    });

    test('the payments page shows the owner\'s accounts', function () {
        $booking = transferBooking();

        $this->actingAs($booking->car->owner)
            ->get(route('lessor.payments.edit'))
            ->assertInertia(fn ($page) => $page->where('settings.accounts.0.bank_name', 'BDO'));
    });

    test('an owner turns on bank transfer with up to three accounts', function () {
        Storage::fake('public');
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)->put(route('lessor.payments.update'), [
            'accepts_pay_at_pickup' => '0',
            'accepts_bank_transfer' => '1',
            'accounts' => [
                ['bank_name' => 'GCash', 'account_name' => 'Juan Dela Cruz', 'account_number' => '09171234567', 'qr' => UploadedFile::fake()->image('qr.png')],
                ['bank_name' => 'BDO', 'account_name' => 'Juan Dela Cruz', 'account_number' => '0012 3456 7890'],
            ],
        ])->assertSessionHasNoErrors();

        $storefront->refresh();
        expect($storefront->acceptedPaymentMethods())->toBe([PaymentMethod::BankTransfer])
            ->and($storefront->paymentAccounts->pluck('bank_name')->all())->toBe(['GCash', 'BDO']);
        Storage::disk('public')->assertExists($storefront->paymentAccounts->first()->qr_path);
    });

    test('an owner can list at most three accounts', function () {
        $storefront = Storefront::factory()->create();
        $account = ['bank_name' => 'BDO', 'account_name' => 'Juan', 'account_number' => '1'];

        $this->actingAs($storefront->owner)
            ->put(route('lessor.payments.update'), [
                'accepts_bank_transfer' => '1',
                'accounts' => [$account, $account, $account, $account],
            ])
            ->assertSessionHasErrors(['accounts' => 'You can add up to 3 accounts.']);
    });

    test('saving removes accounts the owner deleted and keeps the rest', function () {
        $storefront = Storefront::factory()->create(['accepts_bank_transfer' => true]);
        $kept = PaymentAccount::factory()->for($storefront)->create(['bank_name' => 'BDO']);
        PaymentAccount::factory()->for($storefront)->create(['bank_name' => 'GCash', 'position' => 1]);

        $this->actingAs($storefront->owner)->put(route('lessor.payments.update'), [
            'accepts_bank_transfer' => '1',
            'accounts' => [['id' => $kept->id, 'bank_name' => 'BDO Unibank', 'account_name' => 'Juan', 'account_number' => '1']],
        ])->assertSessionHasNoErrors();

        expect($storefront->paymentAccounts()->get())
            ->toHaveCount(1)
            ->first()->bank_name->toBe('BDO Unibank');
    });

    test('bank transfer needs at least one complete account', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)
            ->put(route('lessor.payments.update'), [
                'accepts_bank_transfer' => '1',
                'accounts' => [['bank_name' => 'BDO']],
            ])
            ->assertSessionHasErrors(['accounts.0.account_name', 'accounts.0.account_number']);
    });

    test('switching bank transfer off keeps the saved accounts', function () {
        $storefront = Storefront::factory()->create(['accepts_bank_transfer' => true]);
        PaymentAccount::factory()->for($storefront)->create();

        $this->actingAs($storefront->owner)->put(route('lessor.payments.update'), [
            'accepts_pay_at_pickup' => '1',
            'accepts_bank_transfer' => '0',
        ])->assertSessionHasNoErrors();

        expect($storefront->fresh()->accepts_bank_transfer)->toBeFalse()
            ->and($storefront->paymentAccounts()->count())->toBe(1);
    });

    test('an owner must accept at least one way to pay', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)
            ->put(route('lessor.payments.update'), [
                'accepts_pay_at_pickup' => '0',
                'accepts_bank_transfer' => '0',
            ])
            ->assertSessionHasErrors(['accepts_pay_at_pickup' => 'Accept at least one way to pay.']);
    });
});

describe('booking', function () {
    test('a renter can only choose a payment method the owner accepts', function () {
        $car = Car::factory()->for(Storefront::factory()->create()->owner, 'owner')->create();

        $this->post(route('cars.bookings.store', $car), [
            'start_date' => today()->addDays(3)->toDateString(),
            'end_date' => today()->addDays(5)->toDateString(),
            'renter_name' => 'Juan',
            'renter_email' => 'juan@example.com',
            'renter_phone' => '09171234567',
            'renter_license_number' => 'N01-23-456789',
            'accepted_terms' => '1',
            'payment_method' => 'bank_transfer',
        ])->assertSessionHasErrors(['payment_method' => 'The owner does not accept that payment method.']);
    });
});

describe('renter transfer', function () {
    test('the renter sees where to pay once the owner confirms', function () {
        $booking = transferBooking();

        $this->get($booking->manageUrl())
            ->assertInertia(fn ($page) => $page
                ->where('payment.accounts.0.bank_name', 'BDO')
                ->where('payment.accounts.0.account_number', '0012 3456 7890')
                ->whereNot('payment.submit_url', null));
    });

    test('the renter submits a transfer and the owner is asked to check it', function () {
        Notification::fake();
        Storage::fake('local');
        $booking = transferBooking();

        $this->post(paymentUrl($booking), [
            'payment_reference' => 'BDO-77812',
            'payment_proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertRedirect($booking->manageUrl());

        $booking->refresh();
        expect($booking->payment_status)->toBe(PaymentStatus::Submitted)
            ->and($booking->payment_reference)->toBe('BDO-77812');
        Storage::disk('local')->assertExists($booking->payment_proof_path);
        Notification::assertSentTo($booking->car->owner, PaymentSubmitted::class);
    });

    test('a transfer cannot be sent before the owner confirms', function () {
        $booking = transferBooking(['status' => BookingStatus::Pending, 'confirmed_at' => null]);

        $this->post(paymentUrl($booking), [
            'payment_reference' => 'X',
            'payment_proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertForbidden();
    });

    test('pay-at-pickup bookings take no transfer', function () {
        $booking = transferBooking(['payment_method' => PaymentMethod::PayAtPickup]);

        $this->post(paymentUrl($booking), [
            'payment_reference' => 'X',
            'payment_proof' => UploadedFile::fake()->image('receipt.jpg'),
        ])->assertForbidden();
    });
});

describe('owner review', function () {
    test('the owner marks a transfer as paid and the renter is told', function () {
        Notification::fake();
        $booking = transferBooking(['payment_status' => PaymentStatus::Submitted]);

        $this->actingAs($booking->car->owner)
            ->post(route('lessor.bookings.payment.approve', $booking))
            ->assertRedirect();

        expect($booking->fresh())
            ->payment_status->toBe(PaymentStatus::Paid)
            ->paid_at->not->toBeNull();
        Notification::assertSentOnDemand(PaymentReviewed::class);
    });

    test('a rejected transfer goes back to the renter with a reason', function () {
        Notification::fake();
        $booking = transferBooking(['payment_status' => PaymentStatus::Submitted]);

        $this->actingAs($booking->car->owner)
            ->post(route('lessor.bookings.payment.reject', $booking), ['reason' => 'Amount does not match.'])
            ->assertRedirect();

        $booking->refresh();
        expect($booking->payment_status)->toBe(PaymentStatus::Rejected)
            ->and($booking->payment_rejection_reason)->toBe('Amount does not match.')
            ->and($booking->awaitsTransfer())->toBeTrue();
        Notification::assertSentOnDemand(PaymentReviewed::class);
    });

    test('only the car\'s owner can review or see the transfer', function () {
        Storage::fake('local');
        Storage::disk('local')->put('payment-proofs/receipt.jpg', 'image');
        $booking = transferBooking(['payment_status' => PaymentStatus::Submitted, 'payment_proof_path' => 'payment-proofs/receipt.jpg']);
        $stranger = User::factory()->create();

        $this->actingAs($stranger)->post(route('lessor.bookings.payment.approve', $booking))->assertForbidden();
        $this->actingAs($stranger)->get(route('lessor.bookings.payment.proof', $booking))->assertForbidden();
        $this->actingAs($booking->car->owner)->get(route('lessor.bookings.payment.proof', $booking))->assertOk();
    });
});

describe('payment rules', function () {
    test('confirming a bank transfer booking starts the owner\'s payment deadline in minutes', function () {
        $this->travelTo('2026-11-08 09:00');
        $storefront = Storefront::factory()->create(['accepts_bank_transfer' => true, 'transfer_deadline_minutes' => 30]);
        $booking = Booking::factory()
            ->for(Car::factory()->for($storefront->owner, 'owner'))
            ->create(['payment_method' => PaymentMethod::BankTransfer]);

        $this->actingAs($storefront->owner)
            ->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed']);

        expect($booking->fresh()->payment_due_at->toDateTimeString())->toBe('2026-11-08 09:30:00');
    });

    test('pay-at-pickup bookings get no payment deadline', function () {
        $booking = Booking::factory()->create();

        $this->actingAs($booking->car->owner)
            ->patch(route('lessor.bookings.update', $booking), ['status' => 'confirmed']);

        expect($booking->fresh()->payment_due_at)->toBeNull();
    });

    test('unpaid transfers past the deadline are released automatically', function () {
        Notification::fake();
        $overdue = transferBooking(['payment_due_at' => now()->subMinute()]);
        $onTime = transferBooking(['payment_due_at' => now()->addHour()]);
        $submitted = transferBooking(['payment_due_at' => now()->subMinute(), 'payment_status' => PaymentStatus::Submitted]);
        $pickup = transferBooking(['payment_due_at' => now()->subMinute(), 'payment_method' => PaymentMethod::PayAtPickup]);

        $this->artisan('bookings:release-unpaid')->assertSuccessful();

        expect($overdue->fresh()->status)->toBe(BookingStatus::Cancelled)
            ->and($onTime->fresh()->status)->toBe(BookingStatus::Confirmed)
            ->and($submitted->fresh()->status)->toBe(BookingStatus::Confirmed)
            ->and($pickup->fresh()->status)->toBe(BookingStatus::Confirmed)
            ->and($overdue->events()->sole())
            ->action->toBe('cancelled')
            ->actor_type->toBe('system');
    });

    test('rejecting a transfer gives the renter a fresh deadline', function () {
        $this->travelTo('2026-11-08 09:00');
        $booking = transferBooking(['payment_status' => PaymentStatus::Submitted, 'payment_due_at' => now()->subDay()]);

        $this->actingAs($booking->car->owner)
            ->post(route('lessor.bookings.payment.reject', $booking), ['reason' => 'Wrong amount.']);

        expect($booking->fresh()->payment_due_at->toDateTimeString())->toBe('2026-11-08 10:00:00');
    });

    test('checked screenshots are deleted after the retention period; waiting ones are kept', function () {
        Storage::fake('local');
        Storage::disk('local')->put('payment-proofs/old.jpg', 'x');
        Storage::disk('local')->put('payment-proofs/waiting.jpg', 'x');
        $old = transferBooking([
            'payment_status' => PaymentStatus::Paid,
            'payment_proof_path' => 'payment-proofs/old.jpg',
            'start_date' => now()->subDays(40),
            'end_date' => now()->subDays(35),
        ]);
        transferBooking([
            'payment_status' => PaymentStatus::Submitted,
            'payment_proof_path' => 'payment-proofs/waiting.jpg',
            'start_date' => now()->subDays(40),
            'end_date' => now()->subDays(35),
        ]);

        $this->artisan('payments:prune-proofs')->assertSuccessful();

        Storage::disk('local')->assertMissing('payment-proofs/old.jpg');
        Storage::disk('local')->assertExists('payment-proofs/waiting.jpg');
        expect($old->fresh()->payment_proof_path)->toBeNull();
    });

    test('an owner sets their transfer deadline but not screenshot retention, which the platform controls', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)->put(route('lessor.payments.update'), [
            'accepts_pay_at_pickup' => '1',
            'transfer_deadline_minutes' => 45,
            'proof_retention_days' => 60,
        ])->assertSessionHasNoErrors();

        expect($storefront->fresh())
            ->transfer_deadline_minutes->toBe(45)
            ->proof_retention_days->toBeNull();
    });
});
