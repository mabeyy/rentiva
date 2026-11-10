<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->timestamp('reported_at')->nullable()->index();
            $table->string('report_reason')->nullable();
            $table->timestamp('hidden_at')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['reported_at']);
            $table->dropIndex(['hidden_at']);
            $table->dropColumn(['reported_at', 'report_reason', 'hidden_at']);
        });
    }
};
