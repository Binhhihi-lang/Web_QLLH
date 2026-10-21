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
        Schema::create('sinh_viens', function (Blueprint $table) {
            $table->id();
            $table->string('ma_sv')->unique();
            $table->string('ho_ten');
            $table->string('email')->unique();
            $table->date('ngay_sinh')->nullable();
            $table->boolean('gioi_tinh')->default(true); // true = Nam
            $table->foreignId('lop_hoc_id')->nullable()->constrained('lop_hocs')->nullOnDelete();
            $table->string('so_dien_thoai')->nullable();
            $table->text('dia_chi')->nullable();
            $table->boolean('trang_thai')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sinh_viens');
    }
};
