<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Thêm vai trò và trạng thái tài khoản cho người dùng.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // ADMIN = quản trị viên, GIANG_VIEN = giảng viên, SINH_VIEN = sinh viên
            $table->string('vai_tro', 20)->default('SINH_VIEN')->after('email');
            // Cho phép khóa / mở tài khoản mà không cần xóa
            $table->boolean('trang_thai')->default(true)->after('vai_tro');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['vai_tro', 'trang_thai']);
        });
    }
};
