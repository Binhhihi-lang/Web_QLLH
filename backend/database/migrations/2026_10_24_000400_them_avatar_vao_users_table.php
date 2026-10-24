<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ảnh đại diện dùng chung cho cả 3 vai trò (ADR-019).
     * Đặt trên users thay vì sinh_vien/giang_vien để ADMIN cũng có và
     * không phải đồng bộ hai nơi.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('avatar_url')->nullable()->after('email');
            // public_id trên Cloudinary, cần để xóa ảnh cũ khi thay/xóa tài khoản
            $table->string('avatar_public_id', 255)->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar_url', 'avatar_public_id']);
        });
    }
};
