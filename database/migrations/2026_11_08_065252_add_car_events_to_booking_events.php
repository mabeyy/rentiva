<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Let the activity log hold car events, such as blocked dates, that
     * belong to a car rather than a booking.
     */
    public function up(): void
    {
        Schema::table('booking_events', function (Blueprint $table) {
            $table->foreignId('booking_id')->nullable()->change();
            $table->foreignId('car_id')->nullable()->after('booking_id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('booking_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('car_id');
        });
    }
};
