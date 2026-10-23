<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buoi_hoc', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phan')->cascadeOnDelete();
            $table->date('ngay_hoc');
            $table->time('gio_bat_dau');
            $table->time('gio_ket_thuc');
            $table->foreignId('phong_hoc_id')->constrained('phong_hoc')->restrictOnDelete();
            // SCHEDULED | DONE | CANCELLED
            $table->string('trang_thai', 20)->default('SCHEDULED');
            $table->string('ly_do_huy')->nullable();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lop_hoc_phan_id', 'ngay_hoc']);
            $table->index(['phong_hoc_id', 'ngay_hoc']);
            $table->index('ngay_hoc');
            $table->index('trang_thai');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buoi_hoc');
    }
};
