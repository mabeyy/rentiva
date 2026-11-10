<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Room for the plan name plus "(yearly)" or "(upgrade, rest of period)".
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('plan_name', 120)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('plan_name', 60)->change();
        });
    }
};
