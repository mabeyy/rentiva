<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: a plan's features become one list, so new ones can
     * be added without a column each.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->json('features')->nullable()->after('max_staff');
        });

        DB::table('plans')->orderBy('id')->each(function (object $plan): void {
            DB::table('plans')->where('id', $plan->id)->update(['features' => json_encode(array_values(array_filter([
                $plan->includes_sms ? 'sms' : null,
                $plan->includes_calendar_sync ? 'calendar_sync' : null,
                $plan->includes_branded_email ? 'branded_email' : null,
            ])))]);
        });

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['includes_sms', 'includes_calendar_sync', 'includes_branded_email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('includes_sms')->default(false);
            $table->boolean('includes_calendar_sync')->default(false);
            $table->boolean('includes_branded_email')->default(false);
            $table->dropColumn('features');
        });
    }
};
