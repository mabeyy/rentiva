<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. A storefront's city now comes from the pickup location
     * the owner marks as main, instead of separate city and region fields.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->foreignId('main_pickup_location_id')->nullable()->after('owner_id')->constrained('pickup_locations')->nullOnDelete();
        });

        DB::table('storefronts')->get(['id', 'owner_id', 'city'])->each(function (object $storefront): void {
            $locations = DB::table('pickup_locations')->where('owner_id', $storefront->owner_id)->orderBy('id');
            $main = (clone $locations)->where('city', $storefront->city)->first() ?? $locations->first();

            if ($main) {
                DB::table('storefronts')->where('id', $storefront->id)->update([
                    'main_pickup_location_id' => $main->id,
                    'city' => $main->city,
                ]);
            }
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('region')->nullable()->after('city');
            $table->dropConstrainedForeignId('main_pickup_location_id');
        });
    }
};
