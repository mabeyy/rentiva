<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
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
            'plan_id' => Plan::factory(),
            'plan_name' => 'Starter',
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'amount' => 149900,
            'status' => 'unpaid',
            'due_on' => now()->addDays(Invoice::DAYS_TO_PAY)->toDateString(),
        ];
    }
}
