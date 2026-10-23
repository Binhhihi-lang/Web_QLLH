<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diem', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dang_ky_hoc_phan_id')->unique()->constrained('dang_ky_hoc_phan')->cascadeOnDelete();
            $table->decimal('diem_chuyen_can', 4, 2)->nullable();
            $table->decimal('diem_giua_ky', 4, 2)->nullable();
            $table->decimal('diem_cuoi_ky', 4, 2)->nullable();
            $table->decimal('diem_tong_ket', 4, 2)->nullable();
            // A | B | C | D | F — suy ra từ bảng quy đổi trong cau_hinh
            $table->string('diem_chu', 2)->nullable();
            $table->decimal('diem_he_4', 3, 2)->nullable();
            // DAT | KHONG_DAT
            $table->string('ket_qua', 20)->nullable();
            $table->timestamps();

            $table->index('ket_qua');
            $table->index('diem_chu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diem');
    }
};
