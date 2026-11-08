<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * The plans owners choose from. Starter covers the essentials; Growth adds
     * the tools a front desk needs; Fleet adds unlimited room, more locations
     * and making the business look like its own brand.
     */
    public function run(): void
    {
        foreach ([
            [
                'name' => 'Starter', 'description' => 'For a few cars run by one person.', 'price' => 49900, 'sort' => 1,
                'max_cars' => 5, 'max_staff' => 0,
                'features' => [],
            ],
            [
                'name' => 'Growth', 'description' => 'For a growing fleet with a front desk.', 'price' => 149900, 'sort' => 2,
                'max_cars' => 15, 'max_staff' => 3,
                'features' => ['email', 'sms', 'calendar_sync', 'peak_pricing', 'down_payments', 'inspections'],
            ],
            [
                'name' => 'Fleet', 'description' => 'For established rental companies.', 'price' => 399900, 'sort' => 3,
                'max_cars' => null, 'max_staff' => null,
                'features' => array_keys(Plan::FEATURES),
            ],
        ] as $plan) {
            Plan::query()->updateOrCreate(['name' => $plan['name']], [...$plan, 'is_active' => true]);
        }
    }
}
