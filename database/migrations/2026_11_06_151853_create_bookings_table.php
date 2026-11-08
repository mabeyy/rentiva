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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->string('renter_name');
            $table->string('renter_email');
            $table->string('renter_phone');
            $table->string('renter_license_number');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('daily_rate');
            $table->unsignedInteger('total');
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->text('decline_reason')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['car_id', 'status', 'start_date', 'end_date']);
            $table->index('renter_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
