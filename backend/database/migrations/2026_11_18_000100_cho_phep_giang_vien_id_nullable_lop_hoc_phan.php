<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->foreignId('giang_vien_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('lop_hoc_phan', function (Blueprint $table) {
            $table->foreignId('giang_vien_id')->nullable(false)->change();
        });
    }
};
