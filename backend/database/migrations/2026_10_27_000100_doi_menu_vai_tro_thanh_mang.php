<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `menu.vai_tro` từ MỘT vai trò → NHIỀU vai trò.
 *
 * Vì sao: cột cũ chỉ chứa một giá trị nên không diễn đạt được "ADMIN và
 * GIANG_VIEN" cùng thấy một mục. Cách chữa cũ là cho ADMIN thấy tất cả, nhưng
 * như vậy ADMIN lại thấy cả "/dang-ky-cua-toi" và "/diem-cua-toi" — hai trang
 * chỉ có nghĩa với sinh viên.
 *
 * Lưu dạng JSON thay vì chuỗi "ADMIN,GIANG_VIEN" để không phải tự tách chuỗi ở
 * mọi nơi, và để MySQL kiểm tra được tính hợp lệ của JSON.
 *
 * NULL = mọi vai trò đều thấy (giữ nguyên quy ước cũ).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu', function (Blueprint $table) {
            $table->json('vai_tro_moi')->nullable()->after('vai_tro');
        });

        // Dữ liệu cũ: một giá trị → mảng một phần tử.
        foreach (DB::table('menu')->whereNotNull('vai_tro')->get() as $menu) {
            DB::table('menu')
                ->where('id', $menu->id)
                ->update(['vai_tro_moi' => json_encode([$menu->vai_tro])]);
        }

        Schema::table('menu', function (Blueprint $table) {
            $table->dropIndex(['vi_tri', 'vai_tro', 'trang_thai', 'thu_tu']);
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->dropColumn('vai_tro');
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->renameColumn('vai_tro_moi', 'vai_tro');
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->index(['vi_tri', 'trang_thai', 'thu_tu']);
        });
    }

    public function down(): void
    {
        Schema::table('menu', function (Blueprint $table) {
            $table->string('vai_tro_cu', 20)->nullable()->after('vai_tro');
        });

        // Chỉ giữ vai trò đầu tiên — không thể khôi phục thông tin đã mất.
        foreach (DB::table('menu')->whereNotNull('vai_tro')->get() as $menu) {
            $danhSach = json_decode($menu->vai_tro, true);
            DB::table('menu')
                ->where('id', $menu->id)
                ->update(['vai_tro_cu' => is_array($danhSach) ? ($danhSach[0] ?? null) : null]);
        }

        Schema::table('menu', function (Blueprint $table) {
            $table->dropIndex(['vi_tri', 'trang_thai', 'thu_tu']);
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->dropColumn('vai_tro');
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->renameColumn('vai_tro_cu', 'vai_tro');
        });

        Schema::table('menu', function (Blueprint $table) {
            $table->index(['vi_tri', 'vai_tro', 'trang_thai', 'thu_tu']);
        });
    }
};
