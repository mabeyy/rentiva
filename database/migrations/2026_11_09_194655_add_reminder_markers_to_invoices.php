<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When each reminder went out, so a missed day catches up and a rerun
     * doesn't send it twice.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('due_reminder_sent_at')->nullable();
            $table->timestamp('overdue_reminder_sent_at')->nullable();
        });

        // The old job already sent these for invoices past those points.
        DB::table('invoices')->whereDate('due_on', '<=', today())->update(['due_reminder_sent_at' => now()]);
        DB::table('invoices')->whereDate('due_on', '<', today()->subDay())->update(['overdue_reminder_sent_at' => now()]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['due_reminder_sent_at', 'overdue_reminder_sent_at']);
        });
    }
};
