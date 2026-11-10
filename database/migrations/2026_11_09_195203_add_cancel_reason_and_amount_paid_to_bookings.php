<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Why a booking was cancelled, shown to the renter; and what the renter
     * actually paid, so later charges or date changes don't rewrite it.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('cancel_reason')->nullable();
            $table->unsignedInteger('amount_paid')->nullable();
        });

        // Online transfers paid the down payment (or the total); bookings the
        // owner added as paid were paid in full.
        DB::table('bookings')->where('payment_status', 'paid')->update([
            'amount_paid' => DB::raw("case when down_payment > 0 and source = 'online' then down_payment else total end"),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['cancel_reason', 'amount_paid']);
        });
    }
};
