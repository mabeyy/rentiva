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
