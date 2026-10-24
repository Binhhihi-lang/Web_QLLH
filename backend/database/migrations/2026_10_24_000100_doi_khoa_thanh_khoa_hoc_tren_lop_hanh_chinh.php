<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ADR-016: `khoa` (K65) là KHÓA — cohort, năm nhập học — không phải
     * khoa/faculty. Viết không dấu trùng nhau nên đổi tên cho hết nhập nhằng.
     * Thêm nganh + nam_nhap_hoc chỉ để lọc/thống kê và tính năm thứ (BR-23).
     */
    public function up(): void
    {
        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->renameColumn('khoa', 'khoa_hoc');
        });

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->string('nganh', 20)->nullable()->after('khoa_hoc');
            $table->unsignedSmallInteger('nam_nhap_hoc')->nullable()->after('nganh');

            $table->index('khoa_hoc');
            $table->index('nganh');
        });
    }

    public function down(): void
    {
        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->dropIndex(['khoa_hoc']);
            $table->dropIndex(['nganh']);
            $table->dropColumn(['nganh', 'nam_nhap_hoc']);
        });

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->renameColumn('khoa_hoc', 'khoa');
        });
    }
};
