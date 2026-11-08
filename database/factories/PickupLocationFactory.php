<?php

namespace Database\Factories;

use App\Models\PickupLocation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PickupLocation>
 */
class PickupLocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'address' => fake()->buildingNumber().' '.fake()->streetName(),
            'city' => fake()->randomElement(['Makati City', 'Taguig City', 'Quezon City', 'Pasay City', 'Cebu City']),
        ];
    }
}
