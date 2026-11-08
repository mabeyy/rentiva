<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\Storefront;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Storefront>
 */
class StorefrontFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->lastName().' Car Rental';
        $handle = Str::slug($name, '');

        return [
            'owner_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name),
            'tagline' => 'Clean, well-maintained cars at fair daily rates.',
            'about' => fake()->paragraph(),
            'city' => fake()->randomElement(['Makati City', 'Cebu City', 'Davao City', 'Cagayan De Oro City']),
            'phone' => '09'.fake()->numerify('#########'),
            'facebook_url' => "https://facebook.com/{$handle}",
            'instagram_url' => fake()->boolean(70) ? "https://instagram.com/{$handle}" : null,
            'tiktok_url' => fake()->boolean(40) ? "https://www.tiktok.com/@{$handle}" : null,
            'brand_color' => fake()->randomElement(['#C62839', '#B0306A', '#6D3FD1', '#1D63D8', '#0E8077', '#2F7D32']),
        ];
    }

    /**
     * Put the owner on a plan, with every feature unless told otherwise.
     *
     * @param  array<string, mixed>  $plan
     */
    public function onPlan(array $plan = []): static
    {
        return $this->afterCreating(fn (Storefront $storefront) => Subscription::factory()
            ->for($storefront->owner, 'owner')
            ->for(Plan::factory()->state($plan))
            ->create());
    }
}
