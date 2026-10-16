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
        Schema::create('galeri_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gallery_post_id')->constrained('galeri_posts')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('media_type')->default('image');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('galeri_media');
    }
};
