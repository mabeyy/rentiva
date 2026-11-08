<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Starter', 'Growth', 'Fleet']),
            'description' => null,
            'price' => 149900,
            'max_cars' => 5,
            'max_staff' => 2,
            'features' => array_keys(Plan::FEATURES),
            'is_active' => true,
            'sort' => 0,
        ];
    }
}
