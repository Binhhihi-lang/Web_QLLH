<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buoi_hoc', function (Blueprint $table) {
            // NULL với dữ liệu cũ và buổi nhập tay bằng giờ.
            $table->unsignedSmallInteger('tiet_bat_dau')->nullable()->after('ngay_hoc');
            $table->unsignedSmallInteger('tiet_ket_thuc')->nullable()->after('tiet_bat_dau');
            // Buổi dạy bù trỏ về buổi bị hủy mà nó bù.
            $table->foreignId('buoi_goc_id')->nullable()->after('phong_hoc_id')
                ->constrained('buoi_hoc')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('buoi_hoc', function (Blueprint $table) {
            $table->dropConstrainedForeignId('buoi_goc_id');
            $table->dropColumn(['tiet_bat_dau', 'tiet_ket_thuc']);
        });
    }
};
