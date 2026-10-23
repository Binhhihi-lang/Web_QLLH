<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('giang_vien', function (Blueprint $table) {
            $table->id();
            $table->string('ma_gv', 50)->unique();
            $table->string('ho_ten');
            $table->string('email')->unique();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('chuyen_mon')->nullable();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('trang_thai');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('giang_vien');
    }
};
