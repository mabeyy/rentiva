<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Retention moves to the platform: a storefront's own value becomes an
     * admin-set override, and null means "use the platform's period".
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedSmallInteger('data_retention_months')->nullable()->default(null)->change();
            $table->unsignedSmallInteger('proof_retention_days')->nullable()->default(null)->change();
        });

        DB::table('storefronts')->update(['data_retention_months' => null, 'proof_retention_days' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('storefronts')->whereNull('data_retention_months')->update(['data_retention_months' => 24]);
        DB::table('storefronts')->whereNull('proof_retention_days')->update(['proof_retention_days' => 30]);

        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedSmallInteger('data_retention_months')->default(24)->change();
            $table->unsignedSmallInteger('proof_retention_days')->default(30)->change();
        });
    }
};
