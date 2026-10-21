<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cho phép giới hạn một mục menu chỉ hiển thị với vai trò nhất định.
     * NULL = mọi vai trò đều thấy.
     */
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->string('vai_tro', 20)->nullable()->after('nhom');
        });
    }

    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn('vai_tro');
        });
    }
};
