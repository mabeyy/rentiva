<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: days an owner takes a car off the calendar, such as
     * for maintenance. Both dates are included.
     */
    public function up(): void
    {
        Schema::create('car_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('reason', 20);
            $table->string('note', 120)->nullable();
            $table->timestamps();

            $table->index(['car_id', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_blocks');
    }
};
