<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Owners may now list up to three transfer accounts,
     * so the single set of bank details becomes their first account.
     */
    public function up(): void
    {
        $now = now();

        DB::table('storefronts')->whereNotNull('bank_name')->get()->each(fn (object $storefront) => DB::table('payment_accounts')->insert([
            'storefront_id' => $storefront->id,
            'bank_name' => $storefront->bank_name,
            'account_name' => (string) $storefront->bank_account_name,
            'account_number' => (string) $storefront->bank_account_number,
            'qr_path' => $storefront->payment_qr_path,
            'position' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'bank_account_name', 'bank_account_number', 'payment_qr_path']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('bank_name', 80)->nullable()->after('accepts_bank_transfer');
            $table->string('bank_account_name', 120)->nullable()->after('bank_name');
            $table->string('bank_account_number', 40)->nullable()->after('bank_account_name');
            $table->string('payment_qr_path')->nullable()->after('bank_account_number');
        });

        DB::table('payment_accounts')->orderBy('position')->get()->unique('storefront_id')->each(fn (object $account) => DB::table('storefronts')
            ->where('id', $account->storefront_id)
            ->update([
                'bank_name' => $account->bank_name,
                'bank_account_name' => $account->account_name,
                'bank_account_number' => $account->account_number,
                'payment_qr_path' => $account->qr_path,
            ]));
    }
};
