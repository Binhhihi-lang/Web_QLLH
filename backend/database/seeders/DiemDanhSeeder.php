<?php

namespace Database\Seeders;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\DiemDanh;
use App\Models\LopHocPhan;
use Illuminate\Database\Seeder;

class DiemDanhSeeder extends Seeder
{
    /**
     * Điểm danh cho các buổi đã DONE. ~85% có mặt, 5% muộn, 7% vắng, 3% có phép.
     */
    public function run(): void
    {
        if (DiemDanh::query()->exists()) {
            return;
        }

        $dangKyTheoLop = DangKyHocPhan::query()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->get(['id', 'lop_hoc_phan_id'])
            ->groupBy('lop_hoc_phan_id');

        // user_id của giảng viên phụ trách từng lớp, lấy một lượt.
        $gvTheoLop = LopHocPhan::query()
            ->join('giang_vien', 'giang_vien.id', '=', 'lop_hoc_phan.giang_vien_id')
            ->pluck('giang_vien.user_id', 'lop_hoc_phan.id');

        $buoiDaDienRa = BuoiHoc::query()
            ->where('trang_thai', BuoiHoc::DONE)
            ->orderBy('id')
            ->get(['id', 'lop_hoc_phan_id']);

        $bayGio = now();
        $rows = [];

        foreach ($buoiDaDienRa as $buoi) {
            $dangKys = $dangKyTheoLop->get($buoi->lop_hoc_phan_id, collect());
            $gvId = $gvTheoLop[$buoi->lop_hoc_phan_id] ?? null;

            if ($gvId === null) {
                continue;
            }

            foreach ($dangKys as $dangKy) {
                $so = random_int(1, 100);
                $trangThai = match (true) {
                    $so <= 85 => DiemDanh::PRESENT,
                    $so <= 90 => DiemDanh::LATE,
                    $so <= 97 => DiemDanh::ABSENT,
                    default => DiemDanh::EXCUSED,
                };

                $rows[] = [
                    'buoi_hoc_id' => $buoi->id,
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'trang_thai' => $trangThai,
                    'ghi_chu' => null,
                    'diem_danh_boi' => $gvId,
                    'diem_danh_luc' => $bayGio,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        foreach (array_chunk($rows, 2000) as $chunk) {
            DiemDanh::query()->insert($chunk);
        }
    }
}
