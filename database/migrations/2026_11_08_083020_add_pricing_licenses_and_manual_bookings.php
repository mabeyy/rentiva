<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: deposits, discounts and extras on cars; the price
     * breakdown, license photo and source on bookings (with email and license
     * optional for bookings an owner adds); owner replies on reviews.
     */
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->unsignedInteger('security_deposit')->default(0)->after('daily_rate');
            $table->unsignedTinyInteger('weekly_discount')->default(0)->after('security_deposit');
            $table->unsignedTinyInteger('monthly_discount')->default(0)->after('weekly_discount');
            $table->unsignedInteger('delivery_fee')->nullable()->after('monthly_discount');
            $table->unsignedInteger('driver_daily_rate')->nullable()->after('delivery_fee');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('renter_email')->nullable()->change();
            $table->string('renter_license_number')->nullable()->change();
            $table->unsignedInteger('subtotal')->default(0)->after('daily_rate');
            $table->unsignedInteger('discount')->default(0)->after('subtotal');
            $table->unsignedInteger('delivery_fee')->default(0)->after('discount');
            $table->unsignedInteger('driver_fee')->default(0)->after('delivery_fee');
            $table->unsignedInteger('security_deposit')->default(0)->after('total');
            $table->boolean('with_driver')->default(false)->after('security_deposit');
            $table->string('delivery_address', 255)->nullable()->after('with_driver');
            $table->string('source', 20)->default('online')->after('status');
            $table->string('license_photo_path')->nullable()->after('renter_license_number');
            $table->timestamp('license_checked_at')->nullable()->after('license_photo_path');
            $table->string('renter_phone_key', 20)->nullable()->after('renter_phone')->index();
        });

        DB::table('bookings')->update(['subtotal' => DB::raw('total')]);
        DB::table('bookings')->orderBy('id')->each(function (object $booking): void {
            DB::table('bookings')->where('id', $booking->id)->update([
                'renter_phone_key' => preg_replace('/^\+?63/', '0', preg_replace('/\D/', '', (string) $booking->renter_phone)),
            ]);
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->boolean('requires_license_photo')->default(false)->after('data_retention_months');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->text('owner_reply')->nullable()->after('comment');
            $table->timestamp('replied_at')->nullable()->after('owner_reply');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['owner_reply', 'replied_at']);
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn('requires_license_photo');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['renter_phone_key']);
            $table->dropColumn([
                'subtotal', 'discount', 'delivery_fee', 'driver_fee', 'security_deposit', 'with_driver',
                'delivery_address', 'source', 'license_photo_path', 'license_checked_at', 'renter_phone_key',
            ]);
        });

        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn(['security_deposit', 'weekly_discount', 'monthly_discount', 'delivery_fee', 'driver_daily_rate']);
        });
    }
};
