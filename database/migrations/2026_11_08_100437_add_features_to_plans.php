<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: what each plan unlocks beyond its car and staff
     * limits. The app checks these, so the pricing page stays accurate.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('includes_sms')->default(false)->after('max_staff');
            $table->boolean('includes_calendar_sync')->default(false)->after('includes_sms');
            $table->boolean('includes_branded_email')->default(false)->after('includes_calendar_sync');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['includes_sms', 'includes_calendar_sync', 'includes_branded_email']);
        });
    }
};
