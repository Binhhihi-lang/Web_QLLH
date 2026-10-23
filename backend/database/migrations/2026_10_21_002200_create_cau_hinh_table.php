<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cau_hinh', function (Blueprint $table) {
            $table->id();
            $table->string('khoa', 100)->unique();
            $table->json('gia_tri');
            $table->string('mo_ta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cau_hinh');
    }
};
