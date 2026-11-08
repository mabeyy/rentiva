<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. How the renter pays, and the bank transfer they
     * submit for the owner to check.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('payment_method')->default('pickup')->after('total');
            $table->string('payment_status')->default('unpaid')->after('payment_method');
            $table->string('payment_reference', 60)->nullable()->after('payment_status');
            $table->string('payment_proof_path')->nullable()->after('payment_reference');
            $table->text('payment_rejection_reason')->nullable()->after('payment_proof_path');
            $table->timestamp('payment_submitted_at')->nullable()->after('payment_rejection_reason');
            $table->timestamp('paid_at')->nullable()->after('payment_submitted_at');

            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropColumn(['payment_method', 'payment_status', 'payment_reference', 'payment_proof_path', 'payment_rejection_reason', 'payment_submitted_at', 'paid_at']);
        });
    }
};
