<?php

namespace Database\Factories;

use App\Enums\BlockReason;
use App\Models\Car;
use App\Models\CarBlock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CarBlock>
 */
class CarBlockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = now()->addDays(fake()->numberBetween(1, 30))->startOfDay();

        return [
            'car_id' => Car::factory(),
            'start_date' => $startDate,
            'end_date' => $startDate->copy()->addDays(fake()->numberBetween(0, 3)),
            'reason' => BlockReason::Maintenance,
            'note' => null,
        ];
    }
}
