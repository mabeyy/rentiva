<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. The transfer deadline is set in minutes, so owners
     * can keep it short; existing hour values carry over.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedSmallInteger('transfer_deadline_minutes')->default(60)->after('accepts_bank_transfer');
        });

        DB::table('storefronts')->update(['transfer_deadline_minutes' => DB::raw('transfer_deadline_hours * 60')]);

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('transfer_deadline_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedSmallInteger('transfer_deadline_hours')->default(24)->after('accepts_bank_transfer');
        });

        DB::table('storefronts')->update(['transfer_deadline_hours' => DB::raw('MAX(1, transfer_deadline_minutes / 60)')]);

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('transfer_deadline_minutes');
        });
    }
};
