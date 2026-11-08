<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations: booking emails become a plan feature, kept on every
     * plan that already had paid features.
     */
    public function up(): void
    {
        DB::table('plans')->orderBy('id')->each(function (object $plan): void {
            $features = json_decode($plan->features ?? '[]', true) ?: [];

            if ($features !== [] && ! in_array('email', $features, true)) {
                array_unshift($features, 'email');
                DB::table('plans')->where('id', $plan->id)->update(['features' => json_encode($features)]);
            }
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
