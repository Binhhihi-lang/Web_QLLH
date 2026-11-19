<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hoc_ky', function (Blueprint $table) {
            $table->date('ngay_bat_dau_nhap_diem')->nullable()->after('ngay_ket_thuc');
        });

        DB::table('hoc_ky')->whereNull('ngay_bat_dau_nhap_diem')->update([
            'ngay_bat_dau_nhap_diem' => DB::raw('ngay_bat_dau'),
        ]);
    }

    public function down(): void
    {
        Schema::table('hoc_ky', function (Blueprint $table) {
            $table->dropColumn('ngay_bat_dau_nhap_diem');
        });
    }
};
