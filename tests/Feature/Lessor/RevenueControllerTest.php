<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A booking on the owner's car picked up on $date, for $days days at ₱1,000/day.
 */
function revenueBooking(Car $car, string $date, int $days = 2, string $state = 'confirmed'): Booking
{
    return Booking::factory()->for($car)->{$state}()->create([
        'start_date' => $date,
        'end_date' => now()->parse($date)->addDays($days),
        'daily_rate' => 100000,
        'total' => 100000 * $days,
    ]);
}

test('an owner sees revenue from their confirmed and completed bookings only', function () {
    $this->travelTo('2026-11-20');
    $car = Car::factory()->create();
    revenueBooking($car, '2026-11-03', days: 2);
    revenueBooking($car, '2026-11-10', days: 3, state: 'completed');
    revenueBooking($car, '2026-11-12', days: 4, state: 'cancelled');
    Booking::factory()->for($car)->create(['start_date' => '2026-11-14', 'end_date' => '2026-11-15', 'total' => 999999]);
    revenueBooking(Car::factory()->create(), '2026-11-05', days: 5);

    $this->actingAs($car->owner)
        ->get(route('lessor.revenue.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('lessor/revenue')
            ->where('report.from', '2026-11-01')
            ->where('report.to', '2026-11-20')
            ->where('report.totals.revenue', 500000)
            ->where('report.totals.bookings', 2)
            ->where('report.totals.days', 5)
            ->where('report.totals.averagePerDay', 100000));
});

test('revenue can be grouped by month with each month broken down by day', function () {
    $this->travelTo('2026-11-20');
    $car = Car::factory()->create();
    revenueBooking($car, '2026-10-08');
    revenueBooking($car, '2026-11-03');

    $this->actingAs($car->owner)
        ->get(route('lessor.revenue.index', ['granularity' => 'month', 'from' => '2026-10-01', 'to' => '2026-11-20']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('report.rows', 2)
            ->where('report.rows.0.label', 'October 2026')
            ->where('report.rows.0.revenue', 200000)
            ->where('report.rows.0.children.0.key', '2026-10-08'));
});

test('opening a day loads that day\'s bookings', function () {
    $car = Car::factory()->create();
    $booking = revenueBooking($car, '2026-11-03');

    $this->actingAs($car->owner)
        ->get(route('lessor.revenue.index', ['day' => '2026-11-03']))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('dayBookings')
            ->reloadOnly('dayBookings', fn (Assert $reload) => $reload
                ->where('dayBookings.date', '2026-11-03')
                ->where('dayBookings.bookings.0.reference', $booking->reference)));
});

test('the revenue report downloads as CSV', function () {
    $this->travelTo('2026-11-20');
    $car = Car::factory()->create();
    revenueBooking($car, '2026-11-03', days: 2);

    $csv = $this->actingAs($car->owner)
        ->get(route('lessor.revenue.export', ['granularity' => 'day', 'from' => '2026-11-03', 'to' => '2026-11-03']))
        ->assertOk()
        ->streamedContent();

    expect($csv)->toContain('Day,Bookings,"Rental days","Revenue (PHP)"')
        ->toContain('"Nov 3, 2026",1,2,2000.00')
        ->toContain('Total,1,2,2000.00');
});

test('only lessors can see revenue', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('lessor.revenue.index'))
        ->assertForbidden();
});
