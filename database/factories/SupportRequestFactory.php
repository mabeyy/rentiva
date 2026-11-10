<?php

namespace Database\Factories;

use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupportRequest>
 */
class SupportRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'topic' => 'bookings',
            'reference' => null,
            'message' => fake()->sentence(12),
        ];
    }

    /**
     * Marked handled by an admin.
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => ['resolved_at' => now()]);
    }
}
