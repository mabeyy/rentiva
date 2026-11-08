<?php

use App\Actions\Bookings\PriceBooking;
use App\Models\Booking;
use App\Models\Car;
use App\Models\PeakSeason;
use App\Models\Storefront;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array<string, mixed>
 */
function ruleRequest(int $startInDays, int $days): array
{
    return [
        'start_date' => today()->addDays($startInDays)->toDateString(),
        'end_date' => today()->addDays($startInDays + $days)->toDateString(),
        'renter_name' => 'Juan Dela Cruz',
        'renter_email' => 'juan@example.com',
        'renter_phone' => '09171234567',
        'renter_license_number' => 'N01',
        'accepted_terms' => '1',
    ];
}

describe('peak seasons', function () {
    test('days in a season are priced up or down', function () {
        $car = Car::factory()->for(Storefront::factory()->onPlan()->create()->owner, 'owner')->create(['daily_rate' => 100000]);
        PeakSeason::factory()->for($car->owner, 'owner')->create([
            'start_date' => today()->addDays(2)->toDateString(),
            'end_date' => today()->addDays(3)->toDateString(),
            'rate_change' => 50,
        ]);

        $price = app(PriceBooking::class)->handle($car, today()->addDay(), today()->addDays(5));

        // Day 1 normal, days 2–3 at +50%, day 4 normal.
        expect($price['subtotal'])->toBe(100000 + 150000 + 150000 + 100000);
    });

    test('an owner adds, edits and removes seasons, which can\'t overlap', function () {
        $owner = Storefront::factory()->onPlan()->create()->owner;
        $this->actingAs($owner);

        $this->post(route('lessor.seasons.store'), ['name' => 'Christmas', 'start_date' => '2026-12-20', 'end_date' => '2027-01-03', 'rate_change' => 30])
            ->assertSessionHasNoErrors();
        $this->post(route('lessor.seasons.store'), ['name' => 'New Year', 'start_date' => '2027-01-01', 'end_date' => '2027-01-05', 'rate_change' => 40])
            ->assertSessionHasErrors(['start_date' => 'This overlaps another season.']);

        $season = $owner->peakSeasons()->sole();
        $this->put(route('lessor.seasons.update', $season), ['name' => 'Christmas', 'start_date' => '2026-12-20', 'end_date' => '2027-01-03', 'rate_change' => 35]);
        expect($season->fresh()->rate_change)->toBe(35);

        $this->get(route('lessor.seasons.index'))->assertInertia(fn (Assert $page) => $page->has('seasons', 1));

        $this->delete(route('lessor.seasons.destroy', $season));
        expect(PeakSeason::count())->toBe(0);
    });
});

describe('booking limits', function () {
    beforeEach(function () {
        Notification::fake();
        $this->storefront = Storefront::factory()->create(['min_rental_days' => 3, 'advance_notice_hours' => 48, 'max_advance_days' => 60, 'pickup_time' => '09:00']);
        $this->car = Car::factory()->for($this->storefront->owner, 'owner')->create();
    });

    test('renters must book the shortest rental, with enough notice, not too far ahead', function () {
        $this->post(route('cars.bookings.store', $this->car), ruleRequest(10, 2))
            ->assertSessionHasErrors(['end_date' => 'Book at least 3 days.']);
        $this->post(route('cars.bookings.store', $this->car), ruleRequest(1, 3))
            ->assertSessionHasErrors(['start_date' => 'Book at least 48 hours before pickup.']);
        $this->post(route('cars.bookings.store', $this->car), ruleRequest(70, 3))
            ->assertSessionHasErrors(['start_date' => 'Bookings open 60 days ahead.']);

        $this->post(route('cars.bookings.store', $this->car), ruleRequest(10, 3))->assertSessionHasNoErrors();
        expect(Booking::count())->toBe(1);
    });

    test('owners set the limits on their policies page', function () {
        $this->actingAs($this->storefront->owner)->put(route('lessor.policies.update'), [
            'renter_cancellation' => 'anytime',
            'min_rental_days' => 2,
            'advance_notice_hours' => 0,
            'max_advance_days' => 365,
        ])->assertSessionHasNoErrors();

        expect($this->storefront->fresh())->min_rental_days->toBe(2)->advance_notice_hours->toBe(0)->max_advance_days->toBe(365);
    });
});
