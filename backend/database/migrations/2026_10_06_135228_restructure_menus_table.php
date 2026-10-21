<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->string('ten')->after('id');
            $table->string('url')->after('ten');
            $table->string('vi_tri', 20)->default('sidebar')->after('url');
            $table->string('nhom')->nullable()->after('vi_tri');
            $table->integer('thu_tu')->default(0)->after('nhom');
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->renameColumn('trangthai', 'trang_thai');
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'tenhienthi']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->string('slug')->unique()->after('id');
            $table->string('tenhienthi')->after('slug');
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->renameColumn('trang_thai', 'trangthai');
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn(['ten', 'url', 'vi_tri', 'nhom', 'thu_tu']);
        });
    }
};
