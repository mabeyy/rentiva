<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory()->completed(),
            'car_id' => fn (array $attributes): int => Booking::findOrFail($attributes['booking_id'])->car_id,
            'rating' => fake()->numberBetween(4, 5),
            'comment' => fake()->optional(0.7)->sentence(12),
        ];
    }
}
