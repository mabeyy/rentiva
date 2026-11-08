<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. A pickup location is just its street address and city.
     */
    public function up(): void
    {
        DB::table('pickup_locations')->whereNull('address')->update(['address' => DB::raw('city')]);

        Schema::table('pickup_locations', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('address', 160)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pickup_locations', function (Blueprint $table) {
            $table->string('address', 160)->nullable()->change();
            $table->string('name', 80)->default('Main branch')->after('owner_id');
        });
    }
};
