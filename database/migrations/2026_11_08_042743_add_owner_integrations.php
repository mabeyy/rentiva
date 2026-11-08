<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Each owner connects their own email (Resend), SMS
     * (Semaphore) and Google Calendar; secrets are stored encrypted. Every
     * email and SMS sent is logged so delivery problems are visible.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->text('resend_api_key')->nullable();
            $table->string('mail_from_address')->nullable();
            $table->text('semaphore_api_key')->nullable();
            $table->string('sms_sender_name', 11)->nullable();
            $table->boolean('sms_enabled')->default(false);
            $table->string('google_calendar_id')->nullable();
            $table->string('google_client_email')->nullable();
            $table->text('google_private_key')->nullable();
            $table->boolean('google_calendar_enabled')->default(false);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->string('google_event_id')->nullable()->after('anonymized_at');
        });

        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('storefront_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('channel', 10);
            $table->string('recipient');
            $table->string('summary');
            $table->string('status', 10);
            $table->text('error')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['storefront_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_logs');

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('google_event_id');
        });

        Schema::table('storefronts', function (Blueprint $table) {
            $table->dropColumn([
                'resend_api_key', 'mail_from_address', 'semaphore_api_key', 'sms_sender_name', 'sms_enabled',
                'google_calendar_id', 'google_client_email', 'google_private_key', 'google_calendar_enabled',
            ]);
        });
    }
};
