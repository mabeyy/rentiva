<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * The default feature catalog lessors pick from, by name: [category,
     * vehicles]. Kept in step with the add_category_and_vehicle_to_features
     * migration.
     *
     * @var array<string, array{0: string, 1: string}>
     */
    public const array FEATURES = [
        // Comfort
        'Rear aircon' => ['comfort', 'cars'],
        'Automatic climate control' => ['comfort', 'cars'],
        'Leather seats' => ['comfort', 'cars'],
        'Sunroof' => ['comfort', 'cars'],
        'Third-row seating' => ['comfort', 'cars'],
        'Power sliding doors' => ['comfort', 'cars'],
        // Safety
        'Backup camera' => ['safety', 'cars'],
        '360° camera' => ['safety', 'cars'],
        'Parking sensors' => ['safety', 'cars'],
        'Blind-spot monitor' => ['safety', 'cars'],
        'Lane keep assist' => ['safety', 'cars'],
        'Adaptive cruise control' => ['safety', 'cars'],
        'ISOFIX child-seat mounts' => ['safety', 'cars'],
        'Dashcam' => ['safety', 'all'],
        'Early warning device' => ['safety', 'cars'],
        'Spare tire and tools' => ['safety', 'cars'],
        'Helmet included' => ['safety', 'two_wheelers'],
        'Second helmet for a passenger' => ['safety', 'two_wheelers'],
        // Tech
        'Apple CarPlay' => ['tech', 'cars'],
        'Android Auto' => ['tech', 'cars'],
        'Touchscreen infotainment' => ['tech', 'cars'],
        'Bluetooth' => ['tech', 'cars'],
        'USB charging' => ['tech', 'all'],
        'Wireless charging' => ['tech', 'cars'],
        'Phone holder' => ['tech', 'two_wheelers'],
        // Convenience
        'RFID toll tag (Autosweep / Easytrip)' => ['convenience', 'cars'],
        'Keyless entry' => ['convenience', 'all'],
        'Push-button start' => ['convenience', 'cars'],
        'Child seat available' => ['convenience', 'cars'],
        'Roof rack' => ['convenience', 'cars'],
        'Tow hitch' => ['convenience', 'cars'],
        'Top box' => ['convenience', 'two_wheelers'],
        'Raincoat included' => ['convenience', 'two_wheelers'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::FEATURES as $name => [$category, $vehicles]) {
            Feature::updateOrCreate(['name' => $name], ['category' => $category, 'vehicles' => $vehicles]);
        }
    }
}
