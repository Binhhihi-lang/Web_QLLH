<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dang_ky_hoc_phan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sinh_vien_id')->constrained('sinh_vien')->restrictOnDelete();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phan')->restrictOnDelete();
            // ACTIVE | CANCELLED — không dùng soft delete
            $table->string('trang_thai', 20)->default('ACTIVE');
            $table->foreignId('dang_ky_boi')->constrained('users')->restrictOnDelete();
            $table->dateTime('dang_ky_luc');
            $table->foreignId('huy_boi')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('huy_luc')->nullable();
            $table->string('ly_do_huy')->nullable();
            $table->timestamps();

            $table->unique(['sinh_vien_id', 'lop_hoc_phan_id']);
            $table->index(['lop_hoc_phan_id', 'trang_thai']);
            $table->index(['sinh_vien_id', 'trang_thai']);
            $table->index('dang_ky_luc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dang_ky_hoc_phan');
    }
};
