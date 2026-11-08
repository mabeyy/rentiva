<?php

use App\Models\Car;
use App\Models\Feature;
use App\Models\User;

test('an admin adds a feature to the catalog', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.features.store'), ['name' => 'Dashcam'])
        ->assertSessionHasNoErrors();

    expect(Feature::pluck('name')->all())->toBe(['Dashcam']);
});

test('feature names must be unique', function () {
    Feature::factory()->create(['name' => 'Dashcam']);

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.features.store'), ['name' => 'Dashcam'])
        ->assertSessionHasErrors(['name' => 'The name has already been taken.']);
});

test('a feature can keep its own name when renamed', function () {
    $feature = Feature::factory()->create(['name' => 'Dashcam']);

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.features.update', $feature), ['name' => 'Dashcam'])
        ->assertSessionHasNoErrors();
});

test('removing a feature detaches it from every car', function () {
    $feature = Feature::factory()->create();
    $car = Car::factory()->hasAttached($feature)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->delete(route('admin.features.destroy', $feature));

    expect($car->features()->count())->toBe(0);
});
