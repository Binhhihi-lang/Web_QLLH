<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nhat_ky', function (Blueprint $table) {
            $table->id();
            $table->string('doi_tuong_loai', 50);
            $table->unsignedBigInteger('doi_tuong_id');
            $table->string('hanh_dong', 50);
            $table->json('gia_tri_cu')->nullable();
            $table->json('gia_tri_moi')->nullable();
            $table->foreignId('nguoi_thuc_hien_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ghi_chu')->nullable();
            $table->dateTime('thoi_diem');
            $table->timestamps();

            $table->index(['doi_tuong_loai', 'doi_tuong_id']);
            $table->index('nguoi_thuc_hien_id');
            $table->index('thoi_diem');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nhat_ky');
    }
};
