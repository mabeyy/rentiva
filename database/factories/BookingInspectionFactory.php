<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\BookingInspection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingInspection>
 */
class BookingInspectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'type' => 'pickup',
            'fuel_level' => 8,
            'odometer' => fake()->numberBetween(10000, 90000),
            'notes' => null,
            'photos' => [],
            'recorded_by' => fake()->name(),
        ];
    }
}
