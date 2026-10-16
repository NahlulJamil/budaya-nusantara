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
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aksara_id')->constrained('aksara')->cascadeOnDelete();
            $table->text('question');
            $table->string('displayed_character');
            $table->string('correct_answer');
            $table->text('explanation')->nullable();
            $table->enum('generated_by', ['manual', 'ai'])->default('manual');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
