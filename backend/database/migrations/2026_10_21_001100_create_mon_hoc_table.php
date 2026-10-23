<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mon_hoc', function (Blueprint $table) {
            $table->id();
            $table->string('ma_mon', 20)->unique();
            $table->string('ten_mon');
            $table->unsignedTinyInteger('so_tin_chi');
            $table->text('mo_ta')->nullable();
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
        Schema::dropIfExists('mon_hoc');
    }
};
