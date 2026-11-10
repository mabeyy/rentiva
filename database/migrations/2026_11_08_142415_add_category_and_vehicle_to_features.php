<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The feature catalog by name: [category, vehicles]. Existing features get
     * their group; new ones are added.
     *
     * @var array<string, array{0: string, 1: string}>
     */
    private const array CATALOG = [
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
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('features', function (Blueprint $table) {
            $table->string('category', 20)->default('convenience');
            $table->string('vehicles', 20)->default('cars');
        });

        foreach (self::CATALOG as $name => [$category, $vehicles]) {
            $updated = DB::table('features')->where('name', $name)->update(['category' => $category, 'vehicles' => $vehicles]);

            if ($updated === 0) {
                DB::table('features')->insert(['name' => $name, 'category' => $category, 'vehicles' => $vehicles, 'created_at' => now(), 'updated_at' => now()]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('features', function (Blueprint $table) {
            $table->dropColumn(['category', 'vehicles']);
        });
    }
};
