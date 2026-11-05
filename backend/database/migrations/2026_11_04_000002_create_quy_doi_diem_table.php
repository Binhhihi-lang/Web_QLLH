<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quy_doi_diem', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hoc_ky_id')->unique()->constrained('hoc_ky')->restrictOnDelete();
            $table->json('trong_so');
            $table->json('bang_quy_doi');
            $table->unsignedInteger('so_ngay_sua_diem_danh')->default(7);
            $table->string('quy_tac_lam_tron', 30)->default('HALF_UP_2');
            $table->timestamps();
        });

        Schema::table('diem', function (Blueprint $table) {
            $table->foreignId('quy_doi_diem_id')
                ->nullable()
                ->after('xep_loai')
                ->constrained('quy_doi_diem')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('diem', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quy_doi_diem_id');
        });

        Schema::dropIfExists('quy_doi_diem');
    }
};
