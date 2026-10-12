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
        Schema::create('alat_musik', function (Blueprint $table) {
            $table->foreignId('content_id')->primary()->constrained('cultural_contents')->cascadeOnDelete();
            $table->text('material')->nullable();
            $table->text('how_to_play')->nullable();
            $table->text('function')->nullable();
            $table->string('audio')->nullable();
            $table->foreignId('interactive_asset_id')->nullable()->constrained('interactive_assets')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alat_musik');
    }
};
