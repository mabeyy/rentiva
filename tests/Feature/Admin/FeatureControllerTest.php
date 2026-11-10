<?php

use App\Enums\FeatureCategory;
use App\Enums\FeatureVehicle;
use App\Models\Car;
use App\Models\Feature;
use App\Models\User;

test('an admin adds a feature to the catalog with its group and vehicles', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.features.store'), ['name' => 'Heated seats', 'category' => 'comfort', 'vehicles' => 'cars'])
        ->assertSessionHasNoErrors();

    expect(Feature::where('name', 'Heated seats')->sole())
        ->category->toBe(FeatureCategory::Comfort)
        ->vehicles->toBe(FeatureVehicle::Cars);
});

test('feature names must be unique', function () {
    Feature::factory()->create(['name' => 'Heated seats']);

    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.features.store'), ['name' => 'Heated seats', 'category' => 'comfort', 'vehicles' => 'cars'])
        ->assertSessionHasErrors(['name' => 'The name has already been taken.']);
});

test('a feature can keep its name while moving to another group', function () {
    $feature = Feature::factory()->create(['name' => 'Heated seats', 'category' => FeatureCategory::Comfort]);

    $this->actingAs(User::factory()->admin()->create())
        ->put(route('admin.features.update', $feature), ['name' => 'Heated seats', 'category' => 'convenience', 'vehicles' => 'all'])
        ->assertSessionHasNoErrors();

    expect($feature->fresh())->category->toBe(FeatureCategory::Convenience)->vehicles->toBe(FeatureVehicle::All);
});

test('removing a feature detaches it from every car', function () {
    $feature = Feature::factory()->create();
    $car = Car::factory()->hasAttached($feature)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->delete(route('admin.features.destroy', $feature));

    expect($car->features()->count())->toBe(0);
});

test('the catalog groups the new Philippine and motorcycle features', function () {
    expect(Feature::where('name', 'RFID toll tag (Autosweep / Easytrip)')->sole()->category)->toBe(FeatureCategory::Convenience)
        ->and(Feature::where('name', 'Helmet included')->sole()->vehicles)->toBe(FeatureVehicle::TwoWheelers)
        ->and(Feature::where('name', 'USB charging')->sole()->vehicles)->toBe(FeatureVehicle::All);
});
