<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu', function (Blueprint $table) {
            $table->id();
            $table->string('ten', 100);
            $table->string('url');
            // header | sidebar
            $table->string('vi_tri', 20)->default('sidebar');
            $table->string('nhom', 100)->nullable();
            // null = mọi vai trò đều thấy
            $table->string('vai_tro', 20)->nullable();
            $table->integer('thu_tu')->default(0);
            $table->boolean('trang_thai')->default(true);
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['vi_tri', 'vai_tro', 'trang_thai', 'thu_tu']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu');
    }
};
