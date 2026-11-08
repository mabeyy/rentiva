<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: refunds on cancelled bookings that were paid, and a
     * renter's request to move their dates.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('refund_amount')->nullable()->after('paid_at');
            $table->timestamp('refunded_at')->nullable()->after('refund_amount');
            $table->string('refund_reference', 60)->nullable()->after('refunded_at');
            $table->string('refund_note', 255)->nullable()->after('refund_reference');
            $table->json('change_request')->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['refund_amount', 'refunded_at', 'refund_reference', 'refund_note', 'change_request']);
        });
    }
};
