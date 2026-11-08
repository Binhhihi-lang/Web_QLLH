<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tiet_hoc', function (Blueprint $table) {
            $table->id();
            // Số tiết trong ngày, 1..15. Khung giờ là dữ liệu cấu hình của trường:
            // đổi biểu tiết thì sửa bảng này, không sửa code.
            $table->unsignedSmallInteger('so_tiet')->unique();
            // SANG | CHIEU | TOI — ca thuộc về từng tiết, không thuộc về buổi học.
            $table->string('ca', 10);
            $table->time('gio_bat_dau');
            $table->time('gio_ket_thuc');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tiet_hoc');
    }
};
