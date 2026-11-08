<?php

namespace Database\Factories;

use App\Enums\BodyType;
use App\Enums\CarStatus;
use App\Enums\Drivetrain;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Car;
use App\Models\PickupLocation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Car>
 */
class CarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        [$make, $model] = fake()->randomElement([
            ['Toyota', 'Vios'], ['Toyota', 'Fortuner'], ['Toyota', 'Innova'], ['Honda', 'City'],
            ['Mitsubishi', 'Montero Sport'], ['Nissan', 'Navara'], ['Ford', 'Ranger'], ['Suzuki', 'Ertiga'],
        ]);

        return [
            'owner_id' => User::factory(),
            'make' => $make,
            'model' => $model,
            'year' => fake()->numberBetween(2018, 2026),
            'body_type' => fake()->randomElement(BodyType::cases()),
            'transmission' => fake()->randomElement(Transmission::cases()),
            'fuel_type' => fake()->randomElement([FuelType::Gasoline, FuelType::Diesel, FuelType::Hybrid]),
            'drivetrain' => fake()->randomElement(Drivetrain::cases()),
            'seats' => fake()->randomElement([5, 7]),
            'doors' => 4,
            'luggage_capacity' => fake()->numberBetween(2, 5),
            'fuel_economy_city' => fake()->randomFloat(1, 8, 14),
            'fuel_economy_highway' => fake()->randomFloat(1, 12, 20),
            'exterior_color' => fake()->randomElement(['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue']),
            'pickup_location_id' => fn (array $attributes): int => PickupLocation::factory()->create(['owner_id' => $attributes['owner_id']])->id,
            'description' => fake()->paragraph(),
            'daily_rate' => fake()->numberBetween(18, 65) * 10000,
            'status' => CarStatus::Active,
        ];
    }

    /**
     * Indicate that the car is a draft that has not been submitted.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['status' => CarStatus::Draft]);
    }

    /**
     * Indicate that the car awaits admin review.
     */
    public function pendingReview(): static
    {
        return $this->state(fn (array $attributes) => ['status' => CarStatus::PendingReview]);
    }

    /**
     * Indicate that an admin suspended the listing.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => ['status' => CarStatus::Suspended]);
    }
}
