<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;

test('monthly earnings count only the lessor\'s confirmed and completed bookings this month', function () {
    $lessor = User::factory()->create();
    $car = Car::factory()->for($lessor, 'owner')->create();
    $thisMonth = today()->startOfMonth()->toDateString();
    $nextDay = today()->startOfMonth()->addDay()->toDateString();

    Booking::factory()->for($car)->confirmed()->between($thisMonth, $nextDay)->create(['total' => 300000]);
    Booking::factory()->for($car)->completed()->between($thisMonth, $nextDay)->create(['total' => 200000]);
    Booking::factory()->for($car)->cancelled()->between($thisMonth, $nextDay)->create(['total' => 900000]);
    Booking::factory()->confirmed()->between($thisMonth, $nextDay)->create(['total' => 700000]);

    $this->actingAs($lessor)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('lessor/dashboard')
            ->where('stats.monthEarnings', 500000));
});

test('this week lists pickups and returns by day, with a return before a pickup on the same day', function () {
    $lessor = User::factory()->create();
    $car = Car::factory()->for($lessor, 'owner')->create();
    $day = fn (int $offset): string => today()->addDays($offset)->toDateString();

    $out = Booking::factory()->for($car)->confirmed()->between($day(2), $day(4))->create();
    $back = Booking::factory()->for($car)->confirmed()->between($day(-1), $day(2))->create();
    Booking::factory()->for($car)->confirmed()->between($day(8), $day(10))->create();
    Booking::factory()->for($car)->between($day(1), $day(3))->create();

    $this->actingAs($lessor)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('agenda', 3)
            ->where('agenda.0.type', 'return')
            ->where('agenda.0.booking.reference', $back->reference)
            ->where('agenda.1.type', 'pickup')
            ->where('agenda.1.booking.reference', $out->reference)
            ->where('agenda.2.type', 'return')
            ->where('agenda.2.date', $day(4)));
});

test('confirmed trips that have ended wait to be closed', function () {
    $lessor = User::factory()->create();
    $car = Car::factory()->for($lessor, 'owner')->create();

    $ended = Booking::factory()->for($car)->confirmed()->between(today()->subDays(5)->toDateString(), today()->subDay()->toDateString())->create();
    Booking::factory()->for($car)->completed()->between(today()->subDays(5)->toDateString(), today()->subDay()->toDateString())->create();
    Booking::factory()->for($car)->confirmed()->between(today()->toDateString(), today()->addDays(2)->toDateString())->create();

    $this->actingAs($lessor)
        ->get(route('lessor.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->has('toClose', 1)
            ->where('toClose.0.reference', $ended->reference));
});
