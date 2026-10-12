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
        Schema::create('tradisi', function (Blueprint $table) {
            $table->foreignId('content_id')->primary()->constrained('cultural_contents')->cascadeOnDelete();
            $table->foreignId('jenis_tradisi_id')->constrained('jenis_tradisi')->restrictOnDelete();
            $table->text('process');
            $table->text('values');
            $table->string('implementation_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tradisi');
    }
};
