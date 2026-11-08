<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('brand_color', 7)->nullable()->after('logo_path');
            $table->string('address', 160)->nullable()->after('region');
            $table->string('facebook_url')->nullable()->after('phone');
            $table->string('instagram_url')->nullable()->after('facebook_url');
            $table->string('tiktok_url')->nullable()->after('instagram_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['brand_color', 'address', 'facebook_url', 'instagram_url', 'tiktok_url']);
        });
    }
};
