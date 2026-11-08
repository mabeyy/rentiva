<?php

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin searches bookings by lessor name', function () {
    $lessor = User::factory()->create(['name' => 'Maria Santos']);
    $match = Booking::factory()->for(Car::factory()->for($lessor, 'owner'))->create();
    Booking::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.bookings.index', ['search' => 'Santos']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('bookings.data', 1)
            ->where('bookings.data.0.id', $match->id)
            ->where('bookings.data.0.car.host_name', 'Maria Santos'));
});
