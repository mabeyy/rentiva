<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Features that are no longer sold per plan. */
    private const array RETIRED = ['exports', 'branded_email', 'remove_branding', 'featured_listing', 'priority_support'];

    /**
     * Run the migrations: drop retired features from every plan.
     */
    public function up(): void
    {
        DB::table('plans')->orderBy('id')->each(function (object $plan): void {
            $features = array_values(array_diff(json_decode($plan->features ?? '[]', true) ?: [], self::RETIRED));
            DB::table('plans')->where('id', $plan->id)->update(['features' => json_encode($features)]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
