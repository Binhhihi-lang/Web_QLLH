<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * BR-23 / ADR-016: năm thứ lớp phục vụ. null = mọi năm (môn đại cương).
     * Đây là ràng buộc thô ở cấp lớp, KHÔNG thay thế chương trình đào tạo.
     */
    public function up(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->unsignedTinyInteger('nam_thu')->nullable()->after('si_so_toi_da');
            $table->index('nam_thu');
        });
    }

    public function down(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->dropIndex(['nam_thu']);
            $table->dropColumn('nam_thu');
        });
    }
};
