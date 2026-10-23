<?php

namespace Database\Seeders;

use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use Illuminate\Database\Seeder;

class DiemSeeder extends Seeder
{
    /**
     * Chỉ sinh điểm cho lớp thuộc học kỳ đã đóng (2025-2) — học kỳ đang chạy chưa có điểm.
     * Dùng bảng quy đổi đọc từ cau_hinh để khớp nghiệp vụ thật.
     */
    public function run(): void
    {
        if (Diem::query()->exists()) {
            return;
        }

        $hocKyDaDong = HocKy::query()->where('ma_hoc_ky', '2025-2')->firstOrFail();
        $bangQuyDoi = CauHinh::lay('diem.bang_quy_doi', []);

        $dangKys = DangKyHocPhan::query()
            ->join('lop_hoc_phan', 'lop_hoc_phan.id', '=', 'dang_ky_hoc_phan.lop_hoc_phan_id')
            ->where('lop_hoc_phan.hoc_ky_id', $hocKyDaDong->id)
            ->where('dang_ky_hoc_phan.trang_thai', DangKyHocPhan::ACTIVE)
            ->get(['dang_ky_hoc_phan.id']);

        $bayGio = now();
        $rows = [];

        foreach ($dangKys as $dangKy) {
            $cc = random_int(400, 1000) / 100;
            $gk = random_int(350, 1000) / 100;
            $ck = random_int(300, 1000) / 100;
            $tongKet = round($cc * 0.25 + $gk * 0.25 + $ck * 0.50, 2);

            [$chu, $he4, $dat] = $this->quyDoi($tongKet, $bangQuyDoi);

            $rows[] = [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'diem_chuyen_can' => $cc,
                'diem_giua_ky' => $gk,
                'diem_cuoi_ky' => $ck,
                'diem_tong_ket' => $tongKet,
                'diem_chu' => $chu,
                'diem_he_4' => $he4,
                'ket_qua' => $dat ? Diem::DAT : Diem::KHONG_DAT,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            Diem::query()->insert($chunk);
        }

        // Học kỳ đã đóng coi như đã chốt điểm.
        LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyDaDong->id)
            ->update(['chot_diem_luc' => $bayGio]);
    }

    /**
     * @return array{0: string, 1: float, 2: bool}
     */
    private function quyDoi(float $diem, array $bangQuyDoi): array
    {
        foreach ($bangQuyDoi as $dong) {
            if ($diem >= $dong['tu'] && $diem <= $dong['den']) {
                return [$dong['chu'], $dong['he_4'], $dong['dat']];
            }
        }

        return ['F', 0.0, false];
    }
}
