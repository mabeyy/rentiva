<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: down payments, deposits, extra charges and
     * pickup/return checks on bookings; booking rules and peak seasons for
     * owners; plate, expiry dates and service history for cars.
     */
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->boolean('down_payment_enabled')->default(false)->after('transfer_deadline_minutes');
            $table->unsignedTinyInteger('down_payment_percent')->default(30)->after('down_payment_enabled');
            $table->unsignedTinyInteger('min_rental_days')->default(1)->after('pickup_time');
            $table->unsignedSmallInteger('advance_notice_hours')->default(0)->after('min_rental_days');
            $table->unsignedSmallInteger('max_advance_days')->default(180)->after('advance_notice_hours');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('charges_total')->default(0)->after('driver_fee');
            $table->unsignedInteger('down_payment')->default(0)->after('total');
            $table->timestamp('deposit_collected_at')->nullable()->after('security_deposit');
            $table->unsignedInteger('deposit_returned_amount')->nullable()->after('deposit_collected_at');
            $table->timestamp('deposit_returned_at')->nullable()->after('deposit_returned_amount');
            $table->string('deposit_note', 255)->nullable()->after('deposit_returned_at');
        });

        Schema::create('booking_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('label', 80);
            $table->unsignedInteger('amount');
            $table->timestamps();
        });

        Schema::create('booking_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);
            $table->unsignedTinyInteger('fuel_level');
            $table->unsignedInteger('odometer');
            $table->text('notes')->nullable();
            $table->json('photos')->nullable();
            $table->string('recorded_by', 120);
            $table->timestamps();

            $table->unique(['booking_id', 'type']);
        });

        Schema::create('peak_seasons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 60);
            $table->date('start_date');
            $table->date('end_date');
            $table->smallInteger('rate_change');
            $table->timestamps();

            $table->index(['owner_id', 'end_date']);
        });

        Schema::table('cars', function (Blueprint $table) {
            $table->string('plate_number', 15)->nullable()->after('exterior_color');
            $table->date('registration_expires_on')->nullable()->after('plate_number');
            $table->date('insurance_expires_on')->nullable()->after('registration_expires_on');
        });

        Schema::create('car_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->date('serviced_on');
            $table->unsignedInteger('odometer')->nullable();
            $table->string('description', 160);
            $table->unsignedInteger('cost')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_services');
        Schema::table('cars', fn (Blueprint $table) => $table->dropColumn(['plate_number', 'registration_expires_on', 'insurance_expires_on']));
        Schema::dropIfExists('peak_seasons');
        Schema::dropIfExists('booking_inspections');
        Schema::dropIfExists('booking_charges');
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn([
            'charges_total', 'down_payment', 'deposit_collected_at', 'deposit_returned_amount', 'deposit_returned_at', 'deposit_note',
        ]));
        Schema::table('storefronts', fn (Blueprint $table) => $table->dropColumn([
            'down_payment_enabled', 'down_payment_percent', 'min_rental_days', 'advance_notice_hours', 'max_advance_days',
        ]));
    }
};
