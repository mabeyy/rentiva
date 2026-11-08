<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Owners set their usual pickup time and switch the
     * 24-hour and 2-hour pickup reminders on or off per channel; each booking
     * records when each reminder went out so it is only sent once.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->string('pickup_time', 5)->default('09:00');
            $table->boolean('remind_email_24h')->default(true);
            $table->boolean('remind_email_2h')->default(true);
            $table->boolean('remind_sms_24h')->default(true);
            $table->boolean('remind_sms_2h')->default(true);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('reminder_24h_sent_at')->nullable();
            $table->timestamp('reminder_2h_sent_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['reminder_24h_sent_at', 'reminder_2h_sent_at']);
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn(['pickup_time', 'remind_email_24h', 'remind_email_2h', 'remind_sms_24h', 'remind_sms_2h']);
        });
    }
};
