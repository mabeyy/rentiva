<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations: license photo checks are on every plan now, so no
     * plan lists them.
     */
    public function up(): void
    {
        DB::table('plans')->orderBy('id')->each(function (object $plan): void {
            $features = array_values(array_diff(json_decode($plan->features ?? '[]', true) ?: [], ['license_checks']));
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
