<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Danh mục Khoa và Ngành (ADR-020).
 *
 * `khoa` và `nganh` là danh mục hai cấp: mỗi ngành thuộc đúng một khoa.
 * Bảng ngành ra đời vì cùng một khái niệm ngành trước đây bị ghi bằng hai từ
 * vựng khác nhau — `giang_vien.chuyen_mon` ghi TÊN ngành, còn
 * `lop_hanh_chinh.nganh` ghi MÃ ngành, và hai danh sách không khớp nhau.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('khoa', function (Blueprint $table) {
            $table->id();
            $table->string('ma_khoa', 20)->unique();
            $table->string('ten_khoa');
            $table->text('mo_ta')->nullable();
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('trang_thai');
            $table->index('deleted_at');
        });

        Schema::create('nganh', function (Blueprint $table) {
            $table->id();
            // Ngành không thể tồn tại ngoài khoa: xóa khoa còn ngành bị chặn ở tầng DB.
            $table->foreignId('khoa_id')->constrained('khoa')->restrictOnDelete();
            $table->string('ma_nganh', 20)->unique();
            $table->string('ten_nganh');
            $table->text('mo_ta')->nullable();
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['khoa_id', 'ten_nganh']);
            $table->index('trang_thai');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nganh');
        Schema::dropIfExists('khoa');
    }
};
