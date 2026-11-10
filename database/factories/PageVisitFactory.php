<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\PageVisit;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PageVisit>
 */
class PageVisitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'page' => 'home',
            'visitor' => fake()->unique()->regexify('[a-f0-9]{16}'),
            'source' => null,
        ];
    }

    /**
     * A view of the owner's booking page, or of one of its cars.
     */
    public function onStorefront(Storefront $storefront, ?Car $car = null): static
    {
        return $this->state([
            'page' => $car ? 'car' : 'storefront',
            'storefront_id' => $storefront->id,
            'car_id' => $car?->id,
        ]);
    }
}
