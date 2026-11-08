<?php

use App\Enums\CarStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Feature;
use App\Models\PickupLocation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @return array<string, mixed>
 */
function carPayload(array $overrides = []): array
{
    return [
        'make' => 'Toyota',
        'model' => 'Vios',
        'year' => 2024,
        'body_type' => 'sedan',
        'transmission' => 'automatic',
        'fuel_type' => 'gasoline',
        'drivetrain' => 'fwd',
        'seats' => 5,
        'doors' => 4,
        'luggage_capacity' => 2,
        'fuel_economy_city' => 12.5,
        'fuel_economy_highway' => 17.0,
        'exterior_color' => 'White',
        'daily_rate' => 2500,
        ...$overrides,
    ];
}

test('the listing form offers only the lessor\'s own pickup locations', function () {
    $lessor = User::factory()->create();
    PickupLocation::factory()->for($lessor, 'owner')->create(['address' => '123 Gorordo Avenue']);
    PickupLocation::factory()->create(['address' => 'Someone else']);

    $this->actingAs($lessor)
        ->get(route('lessor.cars.create'))
        ->assertInertia(fn ($page) => $page
            ->has('pickupLocations', 1)
            ->where('pickupLocations.0.address', '123 Gorordo Avenue'));
});

test('a car cannot use another lessor\'s pickup location', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('lessor.cars.store'), carPayload(['pickup_location_id' => PickupLocation::factory()->create()->id]))
        ->assertSessionHasErrors(['pickup_location_id' => 'Choose one of your pickup locations.']);
});

describe('store', function () {
    test('a lessor lists a car as a draft with photos, features and the rate in centavos', function () {
        Storage::fake('public');
        $lessor = User::factory()->create();
        $feature = Feature::factory()->create();
        $pickupLocation = PickupLocation::factory()->for($lessor, 'owner')->create();

        $this->actingAs($lessor)->post(route('lessor.cars.store'), carPayload([
            'pickup_location_id' => $pickupLocation->id,
            'features' => [$feature->id],
            'images' => [UploadedFile::fake()->image('front.jpg'), UploadedFile::fake()->image('side.jpg')],
        ]));

        $car = Car::sole();
        expect($car->owner_id)->toBe($lessor->id)
            ->and($car->status)->toBe(CarStatus::Draft)
            ->and($car->daily_rate)->toBe(250000)
            ->and($car->pickup_location_id)->toBe($pickupLocation->id)
            ->and($car->features->pluck('id')->all())->toBe([$feature->id])
            ->and($car->images)->toHaveCount(2);
        Storage::disk('public')->assertExists($car->images->pluck('path')->all());
    });

    test('a lessor lists a scooter, which has no doors or drivetrain', function () {
        Storage::fake('public');
        $lessor = User::factory()->create();

        $this->actingAs($lessor)->post(route('lessor.cars.store'), carPayload([
            'pickup_location_id' => PickupLocation::factory()->for($lessor, 'owner')->create()->id,
            'make' => 'Yamaha',
            'model' => 'NMAX',
            'body_type' => 'scooter',
            'drivetrain' => 'fwd',
            'doors' => 4,
            'seats' => 2,
            'luggage_capacity' => 1,
            'daily_rate' => 600,
            'images' => [UploadedFile::fake()->image('nmax.jpg')],
        ]))->assertSessionHasNoErrors();

        expect(Car::sole())
            ->drivetrain->toBeNull()
            ->doors->toBeNull()
            ->seats->toBe(2);
    });

    test('a scooter carries at most two riders', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('lessor.cars.store'), carPayload(['body_type' => 'scooter', 'seats' => 4]))
            ->assertSessionHasErrors('seats');
    });

    test('a car still needs its doors and drivetrain', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('lessor.cars.store'), carPayload(['doors' => null, 'drivetrain' => null]))
            ->assertSessionHasErrors(['doors', 'drivetrain']);
    });

    test('a listing needs at least one photo', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('lessor.cars.store'), carPayload())
            ->assertSessionHasErrors(['images' => 'The images field is required.']);
    });

    test('a suspended lessor cannot list a car', function () {
        Storage::fake('public');

        $this->actingAs(User::factory()->suspended()->create())
            ->post(route('lessor.cars.store'), carPayload(['images' => [UploadedFile::fake()->image('front.jpg')]]))
            ->assertForbidden();

        expect(Car::count())->toBe(0);
    });
});

describe('update', function () {
    test('a lessor removes and adds photos while editing', function () {
        Storage::fake('public');
        $car = Car::factory()->create();
        $kept = CarImage::factory()->for($car)->create();
        $removed = CarImage::factory()->for($car)->create(['position' => 1]);
        Storage::disk('public')->put($removed->path, 'photo');

        $this->actingAs($car->owner)->put(route('lessor.cars.update', $car), carPayload([
            'pickup_location_id' => $car->pickup_location_id,
            'removed_image_ids' => [$removed->id],
            'images' => [UploadedFile::fake()->image('new.jpg')],
        ]))->assertRedirect(route('lessor.cars.edit', $car));

        expect($car->images()->pluck('id'))->toContain($kept->id)->not->toContain($removed->id)
            ->and($car->images()->count())->toBe(2);
        Storage::disk('public')->assertMissing($removed->path);
    });

    test('removing every photo is rejected', function () {
        $car = Car::factory()->create();
        $image = CarImage::factory()->for($car)->create();

        $this->actingAs($car->owner)
            ->put(route('lessor.cars.update', $car), carPayload(['removed_image_ids' => [$image->id]]))
            ->assertSessionHasErrors(['images' => 'A listing needs between 1 and 10 photos.']);
    });

    test('editing a rejected listing returns it to draft', function () {
        $car = Car::factory()->create(['status' => CarStatus::Rejected]);
        CarImage::factory()->for($car)->create();

        $this->actingAs($car->owner)->put(route('lessor.cars.update', $car), carPayload([
            'pickup_location_id' => $car->pickup_location_id,
        ]));

        expect($car->fresh()->status)->toBe(CarStatus::Draft);
    });

    test('a lessor cannot edit another lessor\'s car', function () {
        $car = Car::factory()->create();

        $this->actingAs(User::factory()->create())
            ->put(route('lessor.cars.update', $car), carPayload())
            ->assertForbidden();
    });
});

describe('destroy', function () {
    test('a lessor deletes a car without upcoming bookings along with its photos', function () {
        Storage::fake('public');
        $car = Car::factory()->create();
        $image = CarImage::factory()->for($car)->create();
        Storage::disk('public')->put($image->path, 'photo');
        Booking::factory()->for($car)->cancelled()->create();

        $this->actingAs($car->owner)
            ->delete(route('lessor.cars.destroy', $car))
            ->assertRedirect(route('lessor.cars.index'));

        expect(Car::count())->toBe(0);
        Storage::disk('public')->assertMissing($image->path);
    });

    test('a car with a confirmed booking cannot be deleted', function () {
        $car = Car::factory()->create();
        Booking::factory()->for($car)->confirmed()->create();

        $this->actingAs($car->owner)
            ->delete(route('lessor.cars.destroy', $car))
            ->assertForbidden();

        expect(Car::count())->toBe(1);
    });
});

test('the lessor\'s car list contains only their own cars', function () {
    $lessor = User::factory()->create();
    Car::factory()->for($lessor, 'owner')->create();
    Car::factory()->create();

    $this->actingAs($lessor)
        ->get(route('lessor.cars.index'))
        ->assertInertia(fn ($page) => $page->component('lessor/cars/index')->has('cars', 1));
});

describe('activation', function () {
    test('a lessor hides an active listing from renters and shows it again', function () {
        $car = Car::factory()->create();

        $this->actingAs($car->owner)
            ->put(route('lessor.cars.activation.update', $car), ['active' => false])
            ->assertRedirect();
        expect($car->fresh())
            ->status->toBe(CarStatus::Inactive)
            ->isListed()->toBeFalse();

        $this->put(route('lessor.cars.activation.update', $car), ['active' => true]);
        expect($car->fresh()->status)->toBe(CarStatus::Active);
    });

    test('only approved listings can be switched on or off', function (CarStatus $status) {
        $car = Car::factory()->create(['status' => $status]);

        $this->actingAs($car->owner)
            ->put(route('lessor.cars.activation.update', $car), ['active' => true])
            ->assertForbidden();

        expect($car->fresh()->status)->toBe($status);
    })->with([CarStatus::Draft, CarStatus::PendingReview, CarStatus::Rejected, CarStatus::Suspended]);

    test('a lessor cannot switch another lessor\'s listing', function () {
        $car = Car::factory()->create();

        $this->actingAs(User::factory()->create())
            ->put(route('lessor.cars.activation.update', $car), ['active' => false])
            ->assertForbidden();
    });
});
