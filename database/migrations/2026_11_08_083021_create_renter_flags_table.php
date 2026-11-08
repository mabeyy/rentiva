<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations: an owner's private warning about a renter, keyed by
     * their normalized mobile number.
     */
    public function up(): void
    {
        Schema::create('renter_flags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('phone_key', 20);
            $table->string('note', 200);
            $table->timestamps();

            $table->unique(['owner_id', 'phone_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('renter_flags');
    }
};
