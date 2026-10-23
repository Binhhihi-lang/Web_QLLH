<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diem_danh', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buoi_hoc_id')->constrained('buoi_hoc')->cascadeOnDelete();
            $table->foreignId('dang_ky_hoc_phan_id')->constrained('dang_ky_hoc_phan')->cascadeOnDelete();
            // PRESENT | LATE | ABSENT | EXCUSED
            $table->string('trang_thai', 20);
            $table->string('ghi_chu')->nullable();
            $table->foreignId('diem_danh_boi')->constrained('users')->restrictOnDelete();
            $table->dateTime('diem_danh_luc');
            $table->timestamps();

            $table->unique(['buoi_hoc_id', 'dang_ky_hoc_phan_id']);
            $table->index('dang_ky_hoc_phan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diem_danh');
    }
};
