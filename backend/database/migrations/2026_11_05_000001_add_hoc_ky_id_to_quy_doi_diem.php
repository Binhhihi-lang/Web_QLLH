<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quy_doi_diem')) {
            return;
        }

        if (! Schema::hasColumn('quy_doi_diem', 'hoc_ky_id')) {
            Schema::table('quy_doi_diem', function (Blueprint $table) {
                $table->unsignedBigInteger('hoc_ky_id')->nullable()->after('id');
            });

            if (Schema::hasColumn('quy_doi_diem', 'hieu_luc_tu_hoc_ky_id')) {
                DB::table('quy_doi_diem')
                    ->whereNull('hoc_ky_id')
                    ->update(['hoc_ky_id' => DB::raw('hieu_luc_tu_hoc_ky_id')]);
            }

            $coHocKyKhongHopLe = DB::table('quy_doi_diem as q')
                ->leftJoin('hoc_ky as hk', 'hk.id', '=', 'q.hoc_ky_id')
                ->whereNull('hk.id')
                ->exists();

            if ($coHocKyKhongHopLe) {
                throw new RuntimeException(
                    'Không thể chuyển cấu hình điểm: có cấu hình chưa ánh xạ được sang học kỳ.',
                );
            }

            Schema::table('quy_doi_diem', function (Blueprint $table) {
                $table->unsignedBigInteger('hoc_ky_id')->nullable(false)->change();
                $table->unique('hoc_ky_id', 'quy_doi_diem_hoc_ky_id_unique');
                $table->foreign('hoc_ky_id', 'quy_doi_diem_hoc_ky_id_foreign')
                    ->references('id')
                    ->on('hoc_ky')
                    ->restrictOnDelete();
            });
        }

        if (! Schema::hasColumn('quy_doi_diem', 'so_ngay_sua_diem_danh')) {
            Schema::table('quy_doi_diem', function (Blueprint $table) {
                $table->unsignedInteger('so_ngay_sua_diem_danh')->default(7);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('quy_doi_diem')) {
            return;
        }

        // This migration only owns these columns when it upgraded the legacy
        // versioned schema. A fresh database already has them from migration
        // 2026_11_04_000002 and must keep them on rollback.
        if (Schema::hasColumn('quy_doi_diem', 'hieu_luc_tu_hoc_ky_id')
            && Schema::hasColumn('quy_doi_diem', 'hoc_ky_id')) {
            Schema::table('quy_doi_diem', function (Blueprint $table) {
                $table->dropForeign('quy_doi_diem_hoc_ky_id_foreign');
                $table->dropUnique('quy_doi_diem_hoc_ky_id_unique');
                $table->dropColumn('hoc_ky_id');
            });
        }

        if (Schema::hasColumn('quy_doi_diem', 'hieu_luc_tu_hoc_ky_id')
            && Schema::hasColumn('quy_doi_diem', 'so_ngay_sua_diem_danh')) {
            Schema::table('quy_doi_diem', function (Blueprint $table) {
                $table->dropColumn('so_ngay_sua_diem_danh');
            });
        }
    }
};
