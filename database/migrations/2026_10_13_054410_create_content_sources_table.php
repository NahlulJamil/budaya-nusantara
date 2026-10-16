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
        Schema::create('content_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('cultural_contents')->cascadeOnDelete();
            $table->string('title');
            $table->text('source_url');
            $table->string('author')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('content_sources');
    }
};
