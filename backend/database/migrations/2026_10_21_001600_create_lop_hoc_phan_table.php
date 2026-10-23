<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lop_hoc_phan', function (Blueprint $table) {
            $table->id();
            $table->string('ma_lop_hp', 30);
            $table->foreignId('mon_hoc_id')->constrained('mon_hoc')->restrictOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_ky')->restrictOnDelete();
            $table->foreignId('giang_vien_id')->constrained('giang_vien')->restrictOnDelete();
            $table->unsignedSmallInteger('si_so_toi_da');
            // OPEN | CLOSED | CANCELLED
            $table->string('trang_thai', 20)->default('OPEN');
            $table->dateTime('chot_diem_luc')->nullable();
            $table->foreignId('chot_diem_boi')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Cố ý KHÔNG lọc deleted_at: mã của bản ghi đã xóa mềm vẫn giữ chỗ (BR-01).
            $table->unique(['hoc_ky_id', 'ma_lop_hp']);
            $table->index('mon_hoc_id');
            $table->index('giang_vien_id');
            $table->index('trang_thai');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lop_hoc_phan');
    }
};
