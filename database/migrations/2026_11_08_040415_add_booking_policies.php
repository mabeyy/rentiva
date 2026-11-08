<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Owners decide whether renters may cancel online and
     * how long renter details are kept before they are stripped.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('renter_cancellation', 20)->default('anytime')->after('payment_policy');
            $table->unsignedSmallInteger('cancellation_notice_hours')->default(24)->after('renter_cancellation');
            $table->unsignedSmallInteger('data_retention_months')->default(24)->after('cancellation_notice_hours');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('anonymized_at')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('anonymized_at');
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['renter_cancellation', 'cancellation_notice_hours', 'data_retention_months']);
        });
    }
};
