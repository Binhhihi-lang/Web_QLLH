<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lich_su_diem', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diem_id')->constrained('diem')->cascadeOnDelete();
            $table->string('truong', 30);
            $table->string('gia_tri_cu', 50)->nullable();
            $table->string('gia_tri_moi', 50)->nullable();
            $table->foreignId('nguoi_sua_id')->constrained('users')->restrictOnDelete();
            $table->string('ly_do')->nullable();
            $table->dateTime('thoi_diem');
            $table->timestamps();

            $table->index(['diem_id', 'thoi_diem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lich_su_diem');
    }
};
