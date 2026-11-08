<?php

namespace Database\Factories;

use App\Models\RenterFlag;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RenterFlag>
 */
class RenterFlagFactory extends Factory
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
            'phone_key' => '09'.fake()->numerify('#########'),
            'note' => 'Returned the car late and dirty.',
        ];
    }
}
