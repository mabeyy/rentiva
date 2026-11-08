<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Owners set how long renters have to transfer, how
     * long screenshots are kept, and a policy renters agree to when booking.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedSmallInteger('transfer_deadline_hours')->default(24)->after('accepts_bank_transfer');
            $table->unsignedSmallInteger('proof_retention_days')->default(30)->after('transfer_deadline_hours');
            $table->text('payment_policy')->nullable()->after('proof_retention_days');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('payment_due_at')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('payment_due_at');
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['transfer_deadline_hours', 'proof_retention_days', 'payment_policy']);
        });
    }
};
