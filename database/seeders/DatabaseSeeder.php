<?php

namespace Database\Seeders;

use App\Models\Storefront;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Rentiva Admin',
            'email' => 'admin@example.com',
        ]);

        User::factory()
            ->has(Storefront::factory()->state([
                'name' => 'ABQ Car Rental',
                'slug' => 'abqcarrental',
                'city' => 'Cagayan De Oro City',
                'brand_color' => null,
            ]))
            ->create([
                'name' => 'Test Lessor',
                'email' => 'lessor@example.com',
            ]);

        User::factory(2)->has(Storefront::factory())->create();

        $this->call([
            PlanSeeder::class,
            FeatureSeeder::class,
            CarSeeder::class,
        ]);
    }
}
