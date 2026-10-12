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
        Schema::create('baju_adat_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('baju_adat', 'content_id')->cascadeOnDelete();
            $table->enum('gender', ['pria', 'wanita']);
            $table->string('avatar_image')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['content_id', 'gender']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baju_adat_variants');
    }
};
