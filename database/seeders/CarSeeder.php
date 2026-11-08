<?php

namespace Database\Seeders;

use App\Enums\BodyType;
use App\Enums\CarStatus;
use App\Enums\Drivetrain;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Feature;
use App\Models\PickupLocation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CarSeeder extends Seeder
{
    /**
     * Sample fleet: [photo prefix, make, model, year, body, fuel, drivetrain, seats, luggage, color, ₱/day, km/L city, km/L hwy].
     * Two-wheelers have no drivetrain; their seats are riders and luggage is helmet storage.
     * Scooters are CVT, motorcycles manual, cars automatic.
     *
     * Two-wheeler photos are from Wikimedia Commons and need attribution if reused publicly:
     * NMAX: "Yamaha NMAX Turbo 155 front side view in Indonesia" by Dedybudiman08 and
     * "Yamaha NMAX 2025" by AVMOTO (CC BY-SA 4.0); ADV: "Honda ADV Motorcycle 2023" by
     * Captainmorlypogi1959 and "Honda ADV160 parked in Kopitiam Ancol" by Firzafp
     * (CC BY-SA 4.0); Sniper: "Yamaha Y15ZR V2" by Jolt737 (CC BY-SA 4.0).
     *
     * @var array<int, array{0: string, 1: string, 2: string, 3: int, 4: BodyType, 5: FuelType, 6: Drivetrain|null, 7: int, 8: int, 9: string, 10: int, 11: float, 12: float}>
     */
    private const array FLEET = [
        ['2016-toyota-rav4-white', 'Toyota', 'RAV4', 2016, BodyType::Suv, FuelType::Hybrid, Drivetrain::Awd, 5, 4, 'White', 3800, 14.5, 13.2],
        ['2025-toyota-rav4-red', 'Toyota', 'RAV4', 2025, BodyType::Suv, FuelType::Gasoline, Drivetrain::Awd, 5, 4, 'Red', 3500, 11.5, 14.9],
        ['2026-toyota-camry-white', 'Toyota', 'Camry', 2026, BodyType::Sedan, FuelType::Hybrid, Drivetrain::Fwd, 5, 3, 'White', 3500, 21.7, 20.8],
        ['2025-toyota-camry-dark-gray', 'Toyota', 'Camry', 2025, BodyType::Sedan, FuelType::Hybrid, Drivetrain::Fwd, 5, 3, 'Dark Gray', 3500, 21.7, 20.8],
        ['2025-toyota-corolla-black', 'Toyota', 'Corolla Altis', 2025, BodyType::Sedan, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'Black', 2800, 13.6, 17.4],
        ['2021-toyota-corolla-red', 'Toyota', 'Corolla Altis', 2021, BodyType::Sedan, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'Red', 2500, 13.6, 17.4],
        ['2019-toyota-highlander-gray', 'Toyota', 'Highlander', 2019, BodyType::Suv, FuelType::Gasoline, Drivetrain::Awd, 7, 3, 'Gray', 4200, 8.9, 12.3],
        ['2021-hyundai-kona-red', 'Hyundai', 'Kona', 2021, BodyType::Crossover, FuelType::Gasoline, Drivetrain::Fwd, 5, 2, 'Red', 2600, 12.8, 14.9],
        ['2018-kia-soul-white', 'Kia', 'Soul', 2018, BodyType::Hatchback, FuelType::Gasoline, Drivetrain::Fwd, 5, 2, 'White', 2000, 10.6, 12.8],
        ['2020-hyundai-sonata-black', 'Hyundai', 'Sonata', 2020, BodyType::Sedan, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'Black', 2700, 11.5, 15.7],
        ['2019-kia-forte-gray', 'Kia', 'Forte', 2019, BodyType::Sedan, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'Gray', 2200, 12.8, 17.4],
        ['2025-toyota-tacoma-silver', 'Toyota', 'Tacoma', 2025, BodyType::Pickup, FuelType::Gasoline, Drivetrain::FourWheelDrive, 5, 5, 'Silver', 4800, 8.5, 11.1],
        ['2026-toyota-tundra-green', 'Toyota', 'Tundra', 2026, BodyType::Pickup, FuelType::Gasoline, Drivetrain::FourWheelDrive, 5, 5, 'Green', 6500, 7.7, 10.2],
        ['2020-nissan-rogue-sport-white', 'Nissan', 'Rogue Sport', 2020, BodyType::Crossover, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'White', 2600, 10.6, 13.6],
        ['2024-nissan-altima-black', 'Nissan', 'Altima', 2024, BodyType::Sedan, FuelType::Gasoline, Drivetrain::Fwd, 5, 3, 'Black', 3000, 11.5, 16.6],
        ['2025-yamaha-nmax-gray', 'Yamaha', 'NMAX 155', 2025, BodyType::Scooter, FuelType::Gasoline, null, 2, 1, 'Matte Gray', 600, 40.0, 44.0],
        ['2025-honda-adv-white', 'Honda', 'ADV 160', 2025, BodyType::Scooter, FuelType::Gasoline, null, 2, 1, 'Pearl White', 700, 42.0, 45.0],
        ['2025-yamaha-sniper-blue', 'Yamaha', 'Sniper 155', 2025, BodyType::Motorcycle, FuelType::Gasoline, null, 2, 0, 'Cyan Blue', 800, 42.0, 46.0],
    ];

    /**
     * Pickup locations in and around each owner's city: [street address, city].
     *
     * @var array<string, array<int, array{0: string, 1: string}>>
     */
    private const array PICKUP_LOCATIONS = [
        'Makati City' => [
            ['8751 Paseo de Roxas', 'Makati City'],
            ['5th Avenue cor. 26th Street', 'Taguig City'],
            ['NAIA Terminal 3 Arrivals, Door 6', 'Pasay City'],
        ],
        'Cebu City' => [
            ['123 Gorordo Avenue, Lahug', 'Cebu City'],
            ['Mactan-Cebu Airport, Terminal 1 Arrivals', 'Lapu-Lapu City'],
            ['45 A.S. Fortuna Street', 'Mandaue City'],
        ],
        'Davao City' => [
            ['J.P. Laurel Avenue, Bajada', 'Davao City'],
            ['Davao International Airport Arrivals', 'Davao City'],
        ],
        'Cagayan De Oro City' => [
            ['88 Corrales Avenue', 'Cagayan De Oro City'],
            ['Laguindingan Airport Arrivals', 'Laguindingan'],
        ],
    ];

    /**
     * Sample renter reviews for completed trips: [stars, comment].
     *
     * @var array<int, array{0: int, 1: string|null}>
     */
    private const array REVIEWS = [
        [5, 'Car was spotless and the owner was right on time for pickup. Will rent again!'],
        [5, 'Super smooth booking. Got a confirmation within the hour.'],
        [4, 'Good condition and fuel-efficient. Pickup spot was a bit hard to find.'],
        [5, null],
        [4, 'Great value for the price. Owner was very accommodating.'],
        [3, 'Okay overall, but the aircon could have been colder.'],
        [5, 'Perfect for our family trip to Tagaytay. Highly recommended.'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $lessors = User::lessors()->with('storefront')->get();
        $pickupLocations = $lessors->mapWithKeys(fn (User $lessor): array => [
            $lessor->id => $this->createPickupLocations($lessor),
        ]);
        $featureIds = Feature::pluck('id');

        foreach (self::FLEET as $index => [$photo, $make, $model, $year, $bodyType, $fuelType, $drivetrain, $seats, $luggage, $color, $rate, $city, $highway]) {
            $owner = $lessors[$index % $lessors->count()];
            $ownerLocations = $pickupLocations[$owner->id];

            $car = Car::factory()
                ->for($owner, 'owner')
                ->create([
                    'make' => $make,
                    'model' => $model,
                    'year' => $year,
                    'body_type' => $bodyType,
                    'transmission' => match ($bodyType) {
                        BodyType::Scooter => Transmission::Cvt,
                        BodyType::Motorcycle => Transmission::Manual,
                        default => Transmission::Automatic,
                    },
                    'fuel_type' => $fuelType,
                    'drivetrain' => $drivetrain,
                    'seats' => $seats,
                    'doors' => $bodyType->isTwoWheeler() ? null : 4,
                    'luggage_capacity' => $luggage,
                    'exterior_color' => $color,
                    'pickup_location_id' => $ownerLocations[intdiv($index, $lessors->count()) % count($ownerLocations)]->id,
                    'daily_rate' => $rate * 100,
                    'fuel_economy_city' => $city,
                    'fuel_economy_highway' => $highway,
                    'status' => in_array($index, [13, 14], true) ? CarStatus::PendingReview : CarStatus::Active,
                ]);

            if (! $bodyType->isTwoWheeler()) {
                $car->features()->attach($featureIds->random(6));
            }

            $this->attachPhotos($car, $photo);

            $this->createSampleBookings($car, offset: $index % 5);
        }
    }

    /**
     * Give a lessor the pickup locations around their storefront's city.
     *
     * @return array<int, PickupLocation>
     */
    private function createPickupLocations(User $lessor): array
    {
        $city = $lessor->storefront?->city ?? 'Makati City';

        return array_map(
            fn (array $location): PickupLocation => $lessor->pickupLocations()->create([
                'address' => $location[0],
                'city' => $location[1],
            ]),
            self::PICKUP_LOCATIONS[$city] ?? [['Main office', $city]],
        );
    }

    /**
     * Create non-overlapping past, current and upcoming bookings for a car.
     */
    private function createSampleBookings(Car $car, int $offset): void
    {
        $periods = [
            [-20 + $offset, -16 + $offset, 'completed'],
            [3 + $offset, 5 + $offset, 'confirmed'],
            [9 + $offset, 12 + $offset, null],
        ];

        foreach ($periods as [$startOffset, $endOffset, $state]) {
            $startDate = today()->addDays($startOffset);
            $endDate = today()->addDays($endOffset);
            $factory = Booking::factory()->for($car);

            $booking = ($state ? $factory->{$state}() : $factory)->create([
                'start_date' => $startDate,
                'end_date' => $endDate,
                'daily_rate' => $car->daily_rate,
                'total' => $car->daily_rate * $startDate->diffInDays($endDate),
                'created_at' => $startDate->subDays(7),
            ]);

            if ($state === 'completed') {
                [$rating, $comment] = self::REVIEWS[($car->id + $offset) % count(self::REVIEWS)];
                $booking->review()->make(['rating' => $rating, 'comment' => $comment])
                    ->car()->associate($car)
                    ->save();
            }
        }
    }

    /**
     * Copy the bundled sample photos for a car into public storage.
     */
    private function attachPhotos(Car $car, string $photoPrefix): void
    {
        $photos = File::glob(database_path("seeders/images/{$photoPrefix}-*.jpg"));

        foreach ($photos as $position => $source) {
            $path = "cars/{$car->slug}/".basename($source);
            Storage::disk('public')->put($path, File::get($source));
            $car->images()->create(['path' => $path, 'position' => $position]);
        }
    }
}
