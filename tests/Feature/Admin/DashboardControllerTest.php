<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('revenue counts confirmed and completed bookings by pickup day', function () {
    $today = today()->toDateString();
    $tomorrow = today()->addDay()->toDateString();
    Booking::factory()->confirmed()->between($today, $tomorrow)->create(['total' => 300000]);
    Booking::factory()->completed()->between($today, $tomorrow)->create(['total' => 200000]);
    Booking::factory()->between($today, $tomorrow)->create(['total' => 900000]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->has('revenue', 14)
            ->where('revenue.13', ['date' => $today, 'total' => 500000]));
});

test('utilization is the share of the next 7 days reserved per car type', function () {
    $suv = Car::factory()->create(['body_type' => 'suv']);
    Car::factory()->create(['body_type' => 'suv']);
    Booking::factory()->for($suv)->confirmed()->between(
        today()->toDateString(),
        today()->addDays(7)->toDateString(),
    )->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('utilization', [
            ['body_type' => 'SUV', 'utilization' => 50],
        ]));
});
