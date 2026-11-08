<?php

namespace Database\Factories;

use App\Models\PaymentAccount;
use App\Models\Storefront;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentAccount>
 */
class PaymentAccountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'storefront_id' => Storefront::factory(),
            'bank_name' => fake()->randomElement(['BDO', 'BPI', 'GCash', 'Maya']),
            'account_name' => fake()->name(),
            'account_number' => fake()->numerify('#### #### ####'),
            'position' => 0,
        ];
    }
}
