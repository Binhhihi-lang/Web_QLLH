<?php

namespace Database\Seeders;

use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use Illuminate\Database\Seeder;

class LopHocPhanSeeder extends Seeder
{
    /**
     * 120 lớp học phần: 80 thuộc 2026-1 (đang diễn ra), 40 thuộc 2025-2 (đã đóng).
     */
    public function run(): void
    {
        if (LopHocPhan::query()->exists()) {
            return;
        }

        $hocKyDangDienRa = HocKy::query()->where('ma_hoc_ky', '2026-1')->firstOrFail();
        $hocKyDaDong = HocKy::query()->where('ma_hoc_ky', '2025-2')->firstOrFail();

        $monIds = MonHoc::query()->orderBy('id')->pluck('id')->all();
        $gvIds = GiangVien::query()->orderBy('id')->pluck('id')->all();

        $bayGio = now();
        $rows = [];
        $dem = 0;

        foreach ([$hocKyDangDienRa->id => 80, $hocKyDaDong->id => 40] as $hocKyId => $soLuong) {
            for ($i = 1; $i <= $soLuong; $i++) {
                $dem++;
                $rows[] = [
                    'ma_lop_hp' => sprintf('LHP%04d', $dem),
                    'mon_hoc_id' => $monIds[($dem - 1) % count($monIds)],
                    'hoc_ky_id' => $hocKyId,
                    'giang_vien_id' => $gvIds[($dem * 3) % count($gvIds)],
                    'si_so_toi_da' => [60, 70, 80, 90][$dem % 4],
                    'trang_thai' => $hocKyId === $hocKyDaDong->id
                        ? LopHocPhan::CLOSED
                        : LopHocPhan::OPEN,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        foreach (array_chunk($rows, 50) as $chunk) {
            LopHocPhan::query()->insert($chunk);
        }
    }
}
