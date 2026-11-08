<?php

use App\Enums\BookingStatus;
use App\Enums\RenterCancellation;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Storefront;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A confirmed booking with an owner using the given cancellation policy.
 */
function bookingUnderPolicy(RenterCancellation $policy, array $attributes = [], int $noticeHours = 24): Booking
{
    $storefront = Storefront::factory()->create(['renter_cancellation' => $policy, 'cancellation_notice_hours' => $noticeHours]);

    return Booking::factory()
        ->for(Car::factory()->for($storefront->owner, 'owner'))
        ->confirmed()
        ->create($attributes);
}

describe('renter cancellation', function () {
    test('renters can cancel any time when the owner allows it', function () {
        $booking = bookingUnderPolicy(RenterCancellation::Anytime);

        $this->get($booking->manageUrl())
            ->assertInertia(fn (Assert $page) => $page->whereNot('cancelUrl', null)->where('cancellationNote', null));
        $this->delete(URL::signedRoute('bookings.destroy', $booking))->assertRedirect();

        expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled);
    });

    test('renters cannot cancel a confirmed booking when the owner never allows it', function () {
        $booking = bookingUnderPolicy(RenterCancellation::Never);

        $this->get($booking->manageUrl())
            ->assertInertia(fn (Assert $page) => $page->where('cancelUrl', null)->whereNot('cancellationNote', null));
        $this->delete(URL::signedRoute('bookings.destroy', $booking))->assertForbidden();

        expect($booking->fresh()->status)->toBe(BookingStatus::Confirmed);
    });

    test('a request the owner has not confirmed can always be withdrawn', function () {
        $booking = bookingUnderPolicy(RenterCancellation::Never, ['status' => BookingStatus::Pending, 'confirmed_at' => null]);

        $this->delete(URL::signedRoute('bookings.destroy', $booking))->assertRedirect();

        expect($booking->fresh()->status)->toBe(BookingStatus::Cancelled);
    });

    test('online cancelling closes the owner\'s notice period before pickup', function () {
        $this->travelTo('2026-11-08 12:00');
        $tooClose = bookingUnderPolicy(RenterCancellation::WithNotice, ['start_date' => '2026-11-09', 'end_date' => '2026-11-11'], noticeHours: 24);
        $plentyOfTime = bookingUnderPolicy(RenterCancellation::WithNotice, ['start_date' => '2026-11-12', 'end_date' => '2026-11-14'], noticeHours: 24);

        $this->delete(URL::signedRoute('bookings.destroy', $tooClose))->assertForbidden();
        $this->delete(URL::signedRoute('bookings.destroy', $plentyOfTime))->assertRedirect();

        expect($tooClose->fresh()->status)->toBe(BookingStatus::Confirmed)
            ->and($plentyOfTime->fresh()->status)->toBe(BookingStatus::Cancelled);
    });
});

describe('settings', function () {
    test('an owner saves their booking and payment policies', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)->put(route('lessor.policies.update'), [
            'renter_cancellation' => 'notice',
            'cancellation_notice_hours' => 48,
            'payment_policy' => 'Free cancellation up to 48 hours before pickup.',
            'data_retention_months' => 120,
        ])->assertRedirect(route('lessor.policies.edit'));

        expect($storefront->fresh())
            ->renter_cancellation->toBe(RenterCancellation::WithNotice)
            ->cancellation_notice_hours->toBe(48)
            ->payment_policy->toBe('Free cancellation up to 48 hours before pickup.')
            ->data_retention_months->toBeNull();
    });

    test('policies are validated', function () {
        $storefront = Storefront::factory()->create();

        $this->actingAs($storefront->owner)
            ->put(route('lessor.policies.update'), [
                'renter_cancellation' => 'sometimes',
            ])
            ->assertSessionHasErrors(['renter_cancellation']);
    });
});

describe('data retention', function () {
    test('renter details are stripped after the owner\'s retention period, keeping the booking', function () {
        Storage::fake('local');
        Storage::disk('local')->put('payment-proofs/old.jpg', 'x');
        $storefront = Storefront::factory()->create(['data_retention_months' => 12]);
        $car = Car::factory()->for($storefront->owner, 'owner')->create();
        $old = Booking::factory()->for($car)->completed()->create([
            'start_date' => now()->subMonths(14),
            'end_date' => now()->subMonths(13),
            'renter_name' => 'Juan Dela Cruz',
            'notes' => 'Please call first',
            'payment_proof_path' => 'payment-proofs/old.jpg',
            'total' => 500000,
        ]);
        $old->events()->create(['action' => 'requested', 'actor_type' => 'renter', 'actor_name' => 'Juan Dela Cruz']);
        $recent = Booking::factory()->for($car)->completed()->create(['start_date' => now()->subMonth(), 'end_date' => now()->subWeeks(3), 'renter_name' => 'Maria']);
        $active = Booking::factory()->for($car)->confirmed()->create(['start_date' => now()->subMonths(14), 'end_date' => now()->subMonths(13), 'renter_name' => 'Pedro']);

        $this->artisan('bookings:anonymize')->assertSuccessful();

        expect($old->fresh())
            ->renter_name->toBe('Removed')
            ->renter_email->toBe('removed@removed.invalid')
            ->notes->toBeNull()
            ->payment_proof_path->toBeNull()
            ->anonymized_at->not->toBeNull()
            ->total->toBe(500000)
            ->and($old->events()->sole()->actor_name)->toBe('Removed')
            ->and($recent->fresh()->renter_name)->toBe('Maria')
            ->and($active->fresh()->renter_name)->toBe('Pedro');
        Storage::disk('local')->assertMissing('payment-proofs/old.jpg');
    });
});
