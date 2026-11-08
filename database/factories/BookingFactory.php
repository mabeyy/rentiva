<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = now()->addDays(fake()->numberBetween(1, 30))->startOfDay();
        $days = fake()->numberBetween(1, 7);
        $dailyRate = fake()->numberBetween(18, 65) * 10000;

        return [
            'car_id' => Car::factory(),
            'renter_name' => fake()->name(),
            'renter_email' => fake()->safeEmail(),
            'renter_phone' => '09'.fake()->numerify('#########'),
            'renter_license_number' => fake()->bothify('N##-##-######'),
            'start_date' => $startDate,
            'end_date' => $startDate->addDays($days),
            'daily_rate' => $dailyRate,
            'subtotal' => $dailyRate * $days,
            'total' => $dailyRate * $days,
            'status' => BookingStatus::Pending,
        ];
    }

    /**
     * Set the rental period.
     */
    public function between(string $startDate, string $endDate): static
    {
        return $this->state(fn (array $attributes) => [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Indicate that the lessor confirmed the booking.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Indicate that the booking was cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Indicate that the rental has finished.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => BookingStatus::Completed,
            'confirmed_at' => now(),
        ]);
    }
}
