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
        Schema::create('cultural_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daerah_id')->constrained('daerah')->cascadeOnDelete();
            $table->enum('category', ['tradisi', 'baju_adat', 'makanan', 'alat_musik']);
            $table->string('title');
            $table->text('description');
            $table->text('history');
            $table->text('meaning');
            $table->string('main_image')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cultural_contents');
    }
};
