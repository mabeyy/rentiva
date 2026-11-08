<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Owners choose which payment methods they accept and
     * where bank transfers should go.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->boolean('accepts_pay_at_pickup')->default(true)->after('listed_in_directory');
            $table->boolean('accepts_bank_transfer')->default(false)->after('accepts_pay_at_pickup');
            $table->string('bank_name', 80)->nullable()->after('accepts_bank_transfer');
            $table->string('bank_account_name', 120)->nullable()->after('bank_name');
            $table->string('bank_account_number', 40)->nullable()->after('bank_account_name');
            $table->string('payment_qr_path')->nullable()->after('bank_account_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['accepts_pay_at_pickup', 'accepts_bank_transfer', 'bank_name', 'bank_account_name', 'bank_account_number', 'payment_qr_path']);
        });
    }
};
