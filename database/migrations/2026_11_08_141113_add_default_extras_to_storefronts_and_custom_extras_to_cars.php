<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Discounts, delivery, driver and the deposit become business-wide
     * defaults that each car follows unless it has its own, and the deposit
     * becomes a percentage of the rental.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->unsignedTinyInteger('default_weekly_discount')->default(0);
            $table->unsignedTinyInteger('default_monthly_discount')->default(0);
            $table->unsignedInteger('default_delivery_fee')->nullable();
            $table->unsignedInteger('default_driver_daily_rate')->nullable();
            $table->unsignedTinyInteger('default_deposit_percent')->default(0);
        });

        Schema::table('cars', function (Blueprint $table) {
            $table->boolean('custom_extras')->default(false);
            $table->unsignedTinyInteger('deposit_percent')->default(0);
        });

        // A fixed deposit becomes the share it was of a typical 3-day rental,
        // rounded to 5%.
        DB::table('cars')->where('security_deposit', '>', 0)->where('daily_rate', '>', 0)->get(['id', 'security_deposit', 'daily_rate'])
            ->each(fn (object $car) => DB::table('cars')->where('id', $car->id)->update([
                'deposit_percent' => min(100, max(5, (int) (round($car->security_deposit / ($car->daily_rate * 3) * 20) * 5))),
            ]));

        // Cars that already have their own discounts, extras or deposit keep them.
        DB::table('cars')
            ->where(fn ($query) => $query
                ->where('weekly_discount', '>', 0)
                ->orWhere('monthly_discount', '>', 0)
                ->orWhereNotNull('delivery_fee')
                ->orWhereNotNull('driver_daily_rate')
                ->orWhere('deposit_percent', '>', 0))
            ->update(['custom_extras' => true]);

        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn('security_deposit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->unsignedInteger('security_deposit')->default(0);
            $table->dropColumn(['custom_extras', 'deposit_percent']);
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['default_weekly_discount', 'default_monthly_discount', 'default_delivery_fee', 'default_driver_daily_rate', 'default_deposit_percent']);
        });
    }
};
