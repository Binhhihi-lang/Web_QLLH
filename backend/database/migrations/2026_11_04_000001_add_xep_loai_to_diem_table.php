<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diem', function (Blueprint $table) {
            $table->string('xep_loai', 100)->nullable()->after('diem_chu');
        });
    }

    public function down(): void
    {
        Schema::table('diem', function (Blueprint $table) {
            $table->dropColumn('xep_loai');
        });
    }
};
