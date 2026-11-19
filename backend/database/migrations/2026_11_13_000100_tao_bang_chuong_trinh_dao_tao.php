<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Chương trình đào tạo — một ngành × một khóa (ADR-016 bổ sung 2026-11-13).
     *
     * Vì sao có bảng này: trước đây ràng buộc duy nhất giữa sinh viên và môn là
     * `lop_hoc_phan.nam_thu` (đã xoá). Muốn biết "sinh viên K68 ngành KTPM học
     * môn gì ở kỳ 7" thì phải có chương trình khung. Không có nó, màn đăng ký
     * của sinh viên không lọc được môn và ADMIN phải mở từng lớp bằng tay.
     */
    public function up(): void
    {
        Schema::create('chuong_trinh_dao_tao', function (Blueprint $table) {
            $table->id();
            $table->string('ma_ctdt', 30)->unique();
            $table->foreignId('nganh_id')->constrained('nganh')->restrictOnDelete();
            // Khóa (cohort) dạng 'K68' — cùng từ vựng với `lop_hanh_chinh.khoa_hoc`.
            $table->string('khoa_hoc', 20);
            $table->string('ten');
            $table->decimal('so_nam', 3, 1)->default(4.0);
            $table->unsignedTinyInteger('so_ky')->default(8);
            $table->text('mo_ta')->nullable();
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Một ngành chỉ có một chương trình cho mỗi khóa.
            $table->unique(['nganh_id', 'khoa_hoc']);
            $table->index('khoa_hoc');
            $table->index('trang_thai');
            $table->index('deleted_at');
        });

        Schema::create('chuong_trinh_mon', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chuong_trinh_id')->constrained('chuong_trinh_dao_tao')->cascadeOnDelete();
            $table->foreignId('mon_hoc_id')->constrained('mon_hoc')->restrictOnDelete();
            // Kỳ thứ trong chương trình (1–10). null = chưa gán kỳ, sinh viên
            // không thấy môn này khi đăng ký cho tới khi gán.
            $table->unsignedTinyInteger('ky_thu')->nullable();
            // true = bắt buộc, false = tự chọn.
            $table->boolean('bat_buoc')->default(true);
            $table->timestamps();

            // Mỗi môn chỉ xuất hiện một lần trong một chương trình.
            $table->unique(['chuong_trinh_id', 'mon_hoc_id']);
            $table->index('ky_thu');
            $table->index('mon_hoc_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chuong_trinh_mon');
        Schema::dropIfExists('chuong_trinh_dao_tao');
    }
};
