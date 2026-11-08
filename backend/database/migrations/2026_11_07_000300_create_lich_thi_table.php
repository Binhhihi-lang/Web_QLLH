<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lich_thi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hoc_ky_id')->constrained('hoc_ky')->restrictOnDelete();
            // Thi theo môn, không theo lớp học phần: một ca thi phục vụ mọi lớp
            // của môn đó trong học kỳ.
            $table->foreignId('mon_hoc_id')->constrained('mon_hoc')->restrictOnDelete();
            $table->date('ngay_thi');
            $table->unsignedSmallInteger('tiet_bat_dau');
            $table->unsignedSmallInteger('tiet_ket_thuc');
            $table->time('gio_bat_dau');
            $table->time('gio_ket_thuc');
            $table->foreignId('phong_hoc_id')->constrained('phong_hoc')->restrictOnDelete();
            // Nhãn tự do để phân biệt giữa kỳ / cuối kỳ. Không ảnh hưởng nghiệp vụ.
            $table->string('dot_thi', 50)->nullable();
            $table->string('ghi_chu')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['hoc_ky_id', 'ngay_thi']);
            $table->index(['phong_hoc_id', 'ngay_thi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lich_thi');
    }
};
