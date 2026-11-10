<?php

namespace Database\Factories;

use App\Enums\FeatureCategory;
use App\Enums\FeatureVehicle;
use App\Models\Feature;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feature>
 */
class FeatureFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'category' => fake()->randomElement(FeatureCategory::cases()),
            'vehicles' => FeatureVehicle::Cars,
        ];
    }

    /**
     * A feature for motorcycles and scooters only.
     */
    public function forTwoWheelers(): static
    {
        return $this->state(['vehicles' => FeatureVehicle::TwoWheelers]);
    }
}
