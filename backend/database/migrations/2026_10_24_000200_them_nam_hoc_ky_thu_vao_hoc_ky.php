<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ADR-016: cần nam_hoc + ky_thu để tính năm thứ của sinh viên
     * (03-data-model.md §5.6) và để báo cáo theo năm học.
     * ADR-017: unique(nam_hoc, ky_thu) chặn trùng kỳ.
     */
    public function up(): void
    {
        Schema::table('hoc_ky', function (Blueprint $table) {
            $table->string('nam_hoc', 9)->nullable()->after('ten_hoc_ky');
            $table->unsignedTinyInteger('ky_thu')->nullable()->after('nam_hoc');
        });

        // Dữ liệu cũ (chỉ là seed) suy ra từ ma_hoc_ky dạng "2026-1".
        foreach (DB::table('hoc_ky')->get() as $ky) {
            $phan = explode('-', (string) $ky->ma_hoc_ky);
            if (count($phan) !== 2 || ! ctype_digit($phan[0])) {
                continue;
            }

            $nam = (int) $phan[0];
            DB::table('hoc_ky')->where('id', $ky->id)->update([
                'nam_hoc' => $nam.'-'.($nam + 1),
                'ky_thu' => (int) $phan[1],
            ]);
        }

        Schema::table('hoc_ky', function (Blueprint $table) {
            $table->string('nam_hoc', 9)->nullable(false)->change();
            $table->unsignedTinyInteger('ky_thu')->nullable(false)->change();
            $table->unique(['nam_hoc', 'ky_thu']);
        });
    }

    public function down(): void
    {
        Schema::table('hoc_ky', function (Blueprint $table) {
            $table->dropUnique(['nam_hoc', 'ky_thu']);
            $table->dropColumn(['nam_hoc', 'ky_thu']);
        });
    }
};
