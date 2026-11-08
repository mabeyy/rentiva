<?php

use App\Models\Car;
use App\Models\PickupLocation;
use App\Models\Storefront;
use App\Models\User;

test('a lessor sees their pickup locations with how many cars use each', function () {
    $lessor = User::factory()->create();
    $location = PickupLocation::factory()->for($lessor, 'owner')->create(['address' => '123 Gorordo Avenue']);
    Car::factory()->for($lessor, 'owner')->create(['pickup_location_id' => $location->id]);
    PickupLocation::factory()->create(['address' => 'Someone else']);

    $this->actingAs($lessor)
        ->get(route('lessor.pickup-locations.index'))
        ->assertInertia(fn ($page) => $page
            ->has('pickupLocations', 1)
            ->where('pickupLocations.0.address', '123 Gorordo Avenue')
            ->where('pickupLocations.0.cars_count', 1));
});

test('a lessor adds a pickup location', function () {
    $lessor = User::factory()->create();

    $this->actingAs($lessor)->post(route('lessor.pickup-locations.store'), [
        'address' => 'Mactan-Cebu Airport, Terminal 1 Arrivals',
        'city' => 'Lapu-Lapu City',
    ])->assertRedirect(route('lessor.pickup-locations.index'));

    expect($lessor->pickupLocations()->sole())
        ->address->toBe('Mactan-Cebu Airport, Terminal 1 Arrivals')
        ->city->toBe('Lapu-Lapu City');
});

test('a pickup location needs a street address and a city', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('lessor.pickup-locations.store'), [])
        ->assertSessionHasErrors(['address', 'city']);
});

test('editing a pickup location moves its cars with it', function () {
    $lessor = User::factory()->create();
    $location = PickupLocation::factory()->for($lessor, 'owner')->create(['city' => 'Cebu City']);
    $car = Car::factory()->for($lessor, 'owner')->create(['pickup_location_id' => $location->id]);

    $this->actingAs($lessor)->put(route('lessor.pickup-locations.update', $location), [
        'address' => '45 A.S. Fortuna Street',
        'city' => 'Mandaue City',
    ])->assertSessionHasNoErrors();

    expect($car->fresh()->pickupLocation->city)->toBe('Mandaue City');
});

test('a lessor cannot change another lessor\'s pickup location', function () {
    $location = PickupLocation::factory()->create();

    $this->actingAs(User::factory()->create())
        ->put(route('lessor.pickup-locations.update', $location), ['address' => 'Mine', 'city' => 'Cebu City'])
        ->assertForbidden();
});

test('a pickup location a car still uses cannot be removed', function () {
    $lessor = User::factory()->create();
    $location = PickupLocation::factory()->for($lessor, 'owner')->create();
    Car::factory()->for($lessor, 'owner')->create(['pickup_location_id' => $location->id]);

    $this->actingAs($lessor)
        ->delete(route('lessor.pickup-locations.destroy', $location))
        ->assertForbidden();

    expect($location->fresh())->not->toBeNull();
});

test('an unused pickup location can be removed', function () {
    $lessor = User::factory()->create();
    $location = PickupLocation::factory()->for($lessor, 'owner')->create();

    $this->actingAs($lessor)
        ->delete(route('lessor.pickup-locations.destroy', $location))
        ->assertRedirect(route('lessor.pickup-locations.index'));

    expect($location->fresh())->toBeNull();
});

test('the main pickup location cannot be removed', function () {
    $storefront = Storefront::factory()->create();
    $main = PickupLocation::factory()->for($storefront->owner, 'owner')->create();

    $this->actingAs($storefront->owner)
        ->delete(route('lessor.pickup-locations.destroy', $main))
        ->assertForbidden();
});

test('a lessor makes another pickup location their main one', function () {
    $storefront = Storefront::factory()->create();
    PickupLocation::factory()->for($storefront->owner, 'owner')->create(['city' => 'Cebu City']);
    $airport = PickupLocation::factory()->for($storefront->owner, 'owner')->create(['city' => 'Lapu-Lapu City']);

    $this->actingAs($storefront->owner)
        ->put(route('lessor.pickup-locations.main', $airport))
        ->assertRedirect(route('lessor.pickup-locations.index'));

    expect($storefront->fresh())
        ->main_pickup_location_id->toBe($airport->id)
        ->city->toBe('Lapu-Lapu City');
});

test('a lessor cannot make another lessor\'s pickup location their main one', function () {
    $storefront = Storefront::factory()->create();

    $this->actingAs($storefront->owner)
        ->put(route('lessor.pickup-locations.main', PickupLocation::factory()->create()))
        ->assertForbidden();
});
