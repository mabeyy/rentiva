<?php

use App\Models\Car;
use App\Models\PickupLocation;
use App\Models\Storefront;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the directory lists rental businesses with their fleet summary', function () {
    $storefront = Storefront::factory()->create(['name' => 'ABQ Car Rental']);
    Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'van', 'daily_rate' => 300000]);
    Car::factory()->for($storefront->owner, 'owner')->create(['body_type' => 'pickup', 'daily_rate' => 129500]);
    Car::factory()->for($storefront->owner, 'owner')->pendingReview()->create(['daily_rate' => 50000]);

    $this->get(route('rent'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('rent/index')
            ->has('storefronts.data', 1)
            ->where('storefronts.data.0.name', 'ABQ Car Rental')
            ->where('storefronts.data.0.vehicle_count', 2)
            ->where('storefronts.data.0.lowest_daily_rate', 129500)
            ->where('storefronts.data.0.body_types', ['Pickup', 'Van']));
});

test('the directory leaves out businesses that opted out, are suspended or have no bookable cars', function () {
    $optedOut = Storefront::factory()->create(['listed_in_directory' => false]);
    Car::factory()->for($optedOut->owner, 'owner')->create();
    $suspended = Storefront::factory()->for(User::factory()->suspended(), 'owner')->create();
    Car::factory()->for($suspended->owner, 'owner')->create();
    $empty = Storefront::factory()->create();
    Car::factory()->for($empty->owner, 'owner')->draft()->create();

    $this->get(route('rent'))->assertInertia(fn (Assert $page) => $page->has('storefronts.data', 0));
});

test('the directory filters by city', function () {
    $cebu = Storefront::factory()->create();
    Car::factory()->for($cebu->owner, 'owner')
        ->for(PickupLocation::factory()->for($cebu->owner, 'owner')->state(['city' => 'Cebu City']))
        ->create();
    $davao = Storefront::factory()->create();
    Car::factory()->for($davao->owner, 'owner')
        ->for(PickupLocation::factory()->for($davao->owner, 'owner')->state(['city' => 'Davao City']))
        ->create();

    $this->get(route('rent', ['city' => 'Cebu City']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('storefronts.data', 1)
            ->where('storefronts.data.0.id', $cebu->id)
            ->where('cities', ['Cebu City', 'Davao City']));
});

test('the home page is the owner landing page without car listings', function () {
    Car::factory()->create();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('home')->missing('featuredCars'));
});
