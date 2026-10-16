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
        Schema::create('galeri_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_post_id')->constrained('galeri_posts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'rejected'])->default('pending');
            $table->timestamps();

            $table->unique(['gallery_post_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('galeri_reports');
    }
};
