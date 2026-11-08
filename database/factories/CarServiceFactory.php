<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\CarService;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CarService>
 */
class CarServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'serviced_on' => now()->subMonth()->toDateString(),
            'odometer' => fake()->numberBetween(10000, 90000),
            'description' => 'Change oil and filter',
            'cost' => 250000,
        ];
    }
}
