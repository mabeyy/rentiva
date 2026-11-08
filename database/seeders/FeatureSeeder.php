<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * The default feature catalog lessors pick from.
     *
     * @var array<int, string>
     */
    public const array FEATURES = [
        'Apple CarPlay', 'Android Auto', 'Bluetooth', 'Backup camera', '360° camera',
        'Blind-spot monitor', 'Lane keep assist', 'Adaptive cruise control', 'Keyless entry',
        'Push-button start', 'Dashcam', 'USB charging', 'Wireless charging', 'Sunroof',
        'Leather seats', 'Rear aircon', 'Child seat available', 'Roof rack', 'Tow hitch',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::FEATURES as $name) {
            Feature::firstOrCreate(['name' => $name]);
        }
    }
}
