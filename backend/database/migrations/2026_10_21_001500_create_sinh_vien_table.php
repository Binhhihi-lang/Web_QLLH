<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sinh_vien', function (Blueprint $table) {
            $table->id();
            $table->string('ma_sv', 50)->unique();
            $table->string('ho_ten');
            $table->date('ngay_sinh')->nullable();
            $table->boolean('gioi_tinh')->default(true);
            $table->string('email')->unique();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->text('dia_chi')->nullable();
            $table->foreignId('lop_hanh_chinh_id')->nullable()->constrained('lop_hanh_chinh')->nullOnDelete();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('lop_hanh_chinh_id');
            $table->index('trang_thai');
            $table->index('deleted_at');
            $table->index('ho_ten');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sinh_vien');
    }
};
