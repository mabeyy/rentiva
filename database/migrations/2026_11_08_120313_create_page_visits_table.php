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
        Schema::create('page_visits', function (Blueprint $table) {
            $table->id();
            $table->string('page', 20);
            $table->foreignId('storefront_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('car_id')->nullable()->constrained()->cascadeOnDelete();
            $table->char('visitor', 16);
            $table->string('source', 60)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['page', 'created_at']);
            $table->index(['storefront_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_visits');
    }
};
