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
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('make');
            $table->string('model');
            $table->unsignedSmallInteger('year');
            $table->string('body_type');
            $table->string('transmission');
            $table->string('fuel_type');
            $table->string('drivetrain');
            $table->unsignedTinyInteger('seats');
            $table->unsignedTinyInteger('doors');
            $table->unsignedTinyInteger('luggage_capacity');
            $table->decimal('fuel_economy_city', 4, 1)->nullable();
            $table->decimal('fuel_economy_highway', 4, 1)->nullable();
            $table->string('exterior_color');
            $table->string('location');
            $table->text('description')->nullable();
            $table->unsignedInteger('daily_rate');
            $table->string('status')->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'body_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
