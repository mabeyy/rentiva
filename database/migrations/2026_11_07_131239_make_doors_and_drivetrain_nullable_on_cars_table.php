<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Two-wheelers have no doors or drivetrain choice.
     */
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->string('drivetrain')->nullable()->change();
            $table->unsignedTinyInteger('doors')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->string('drivetrain')->nullable(false)->change();
            $table->unsignedTinyInteger('doors')->nullable(false)->change();
        });
    }
};
