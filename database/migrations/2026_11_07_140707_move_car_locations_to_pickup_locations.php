<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link each car to one of its owner's pickup locations instead of a typed
     * city, creating a location per city an owner already used. A storefront's
     * single street address moves onto the location in its own city.
     */
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->foreignId('pickup_location_id')->nullable()->after('owner_id')->constrained()->restrictOnDelete();
        });

        $now = now();

        DB::table('cars')->select(['owner_id', 'location'])->distinct()->get()
            ->each(function (object $car) use ($now): void {
                $locationId = DB::table('pickup_locations')->insertGetId([
                    'owner_id' => $car->owner_id,
                    'name' => $car->location,
                    'address' => DB::table('storefronts')
                        ->where('owner_id', $car->owner_id)
                        ->where('city', $car->location)
                        ->value('address'),
                    'city' => $car->location,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('cars')
                    ->where('owner_id', $car->owner_id)
                    ->where('location', $car->location)
                    ->update(['pickup_location_id' => $locationId]);
            });

        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn('location');
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('address', 160)->nullable()->after('region');
        });

        Schema::table('cars', function (Blueprint $table) {
            $table->string('location')->default('')->after('exterior_color');
        });

        DB::table('cars')->get(['id', 'pickup_location_id'])->each(fn (object $car) => DB::table('cars')
            ->where('id', $car->id)
            ->update(['location' => DB::table('pickup_locations')->where('id', $car->pickup_location_id)->value('city') ?? '']));

        Schema::table('cars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_location_id');
        });
    }
};
