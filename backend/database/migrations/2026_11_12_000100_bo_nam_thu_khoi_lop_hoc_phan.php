<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bỏ `lop_hoc_phan.nam_thu` (2026-11-12).
     *
     * Vì sao bỏ: đây là rào chặn DUY NHẤT khiến sinh viên khóa trước không đăng ký
     * được vào lớp khóa dưới — tức chặn chính luồng học lại. Thay rào đó bằng luật
     * đúng ở tầng đăng ký: chặn khi đã ĐẠT môn, cho phép khi CHƯA ĐẠT
     * (DangKyHocPhanService::kiemTraMonDaDat).
     *
     * `down()` tạo lại cột nhưng KHÔNG khôi phục được giá trị cũ — dữ liệu năm thứ
     * đã mất. Chỉ dùng khi cần rollback cấu trúc.
     */
    public function up(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->dropIndex(['nam_thu']);
            $table->dropColumn('nam_thu');
        });
    }

    public function down(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->unsignedTinyInteger('nam_thu')->nullable()->after('si_so_toi_da');
            $table->index('nam_thu');
        });
    }
};
