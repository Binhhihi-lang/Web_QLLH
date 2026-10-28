<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `menu.url` từ varchar(255) → varchar(2048).
 *
 * Vì sao: `MenuRequest` đã validate `max:2048` và form FE đặt
 * `maxlength="2048"`, nhưng cột chỉ chứa 255 ký tự. URL dài hơn 255 lọt qua
 * validate rồi chết ở MySQL strict mode (`SQLSTATE[22001] ... Data too long`),
 * tức người dùng nhận 500 thay vì 422 kèm lý do.
 *
 * Chọn 2048 thay vì siết validate xuống 255 vì 255 quá chật cho URL nội bộ có
 * query string, và `max:2048` mới là con số đã ghi trong hợp đồng API.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu', function (Blueprint $table) {
            $table->string('url', 2048)->change();
        });
    }

    public function down(): void
    {
        Schema::table('menu', function (Blueprint $table) {
            $table->string('url', 255)->change();
        });
    }
};
