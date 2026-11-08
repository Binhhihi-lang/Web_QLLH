<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hình thức học nằm trên TỪNG BUỔI, không trên lớp: một lớp có thể học lý
     * thuyết ở buổi này, thực hành ở buổi khác, trực tuyến ở buổi khác nữa.
     * Mặc định LY_THUYET để dữ liệu cũ hiển thị hợp lý mà không cần backfill.
     */
    public function up(): void
    {
        Schema::table('buoi_hoc', function (Blueprint $table) {
            $table->string('hinh_thuc', 20)->default('LY_THUYET')->after('trang_thai');
            $table->index('hinh_thuc');
        });
    }

    public function down(): void
    {
        Schema::table('buoi_hoc', function (Blueprint $table) {
            $table->dropIndex(['hinh_thuc']);
            $table->dropColumn('hinh_thuc');
        });
    }
};
