<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hoc_ky', function (Blueprint $table) {
            $table->id();
            $table->string('ma_hoc_ky', 20)->unique();
            $table->string('ten_hoc_ky');
            $table->date('ngay_bat_dau');
            $table->date('ngay_ket_thuc');
            $table->dateTime('mo_dang_ky_luc');
            $table->dateTime('dong_dang_ky_luc');
            // UPCOMING | ONGOING | CLOSED
            $table->string('trang_thai', 20);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('trang_thai');
            $table->index('ngay_bat_dau');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hoc_ky');
    }
};
