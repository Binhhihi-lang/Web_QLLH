<?php

namespace Database\Seeders;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Services\QuanLyCauHinhService;
use Illuminate\Database\Seeder;
use LogicException;

class DiemSeeder extends Seeder
{
    /**
     * Sinh điểm cho hai học kỳ:
     * - 2025-2 (đã đóng): toàn bộ lớp học phần đều có đủ điểm và đã chốt điểm.
     * - 2026-1 (đang chạy): chỉ một số môn đã học xong mới có điểm và đã chốt điểm;
     *   các môn còn lại đang học nên chưa có điểm và chưa chốt điểm.
     * - 2026-2 (sắp tới): chưa học nên không có điểm và chưa chốt điểm.
     */
    public function run(): void
    {
        $hocKyDaDong = HocKy::query()->where('ma_hoc_ky', '2025-2')->firstOrFail();
        $hocKyDangChay = HocKy::query()->where('ma_hoc_ky', '2026-1')->firstOrFail();
        $hocKySapToi = HocKy::query()->where('ma_hoc_ky', '2026-2')->first();

        // 1. Học kỳ đã học (2025-2): mọi môn đăng ký đều có đủ điểm và toàn bộ lớp đã chốt điểm
        $this->sinhDiemChoKy($hocKyDaDong);
        LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyDaDong->id)
            ->update(['chot_diem_luc' => now()]);

        // 2. Học kỳ đang học (2026-1): chỉ một vài môn đã học xong mới có điểm và chốt điểm.
        //    - GV demo phụ trách LHP0001, LHP0002, LHP0061, LHP0062, LHP0063 -> chốt 3 lớp (1, 61, 62), 2 lớp chưa có điểm (2, 63).
        //    - SV demo học LHP0061..LHP0068 -> chốt 4 môn (61, 62, 64, 65), 4 môn chưa có điểm (63, 66, 67, 68).
        $lopKyDangChay = LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyDangChay->id)
            ->orderBy('id')
            ->pluck('id');

        $viTriCoDiem = [1, 61, 62, 64, 65];
        $viTriChuaCoDiem = [2, 63, 66, 67, 68];

        $lopHocXongDangChay = $lopKyDangChay->filter(function ($id, $key) use ($viTriCoDiem, $viTriChuaCoDiem) {
            $thuTu = $key + 1;
            if (in_array($thuTu, $viTriCoDiem, true)) {
                return true;
            }
            if (in_array($thuTu, $viTriChuaCoDiem, true)) {
                return false;
            }

            return $key % 4 === 0;
        })->values()->all();

        $lopChuaXongDangChay = $lopKyDangChay->diff($lopHocXongDangChay)->values()->all();

        if (! empty($lopChuaXongDangChay)) {
            $dangKyChuaXongIds = DangKyHocPhan::query()
                ->whereIn('lop_hoc_phan_id', $lopChuaXongDangChay)
                ->pluck('id');
            if ($dangKyChuaXongIds->isNotEmpty()) {
                Diem::query()->whereIn('dang_ky_hoc_phan_id', $dangKyChuaXongIds)->delete();
            }
            LopHocPhan::query()
                ->whereIn('id', $lopChuaXongDangChay)
                ->update(['chot_diem_luc' => null]);
        }

        $this->sinhDiemChoKy($hocKyDangChay, $lopHocXongDangChay);
        LopHocPhan::query()
            ->whereIn('id', $lopHocXongDangChay)
            ->update(['chot_diem_luc' => now()]);

        // 3. Học kỳ sắp tới (2026-2): đảm bảo chưa chốt điểm
        if ($hocKySapToi !== null) {
            LopHocPhan::query()
                ->where('hoc_ky_id', $hocKySapToi->id)
                ->update(['chot_diem_luc' => null]);
        }
    }

    /**
     * Sinh điểm cho các đăng ký ACTIVE chưa có điểm thuộc lớp của một học kỳ.
     * Nếu truyền $chiDinhLopIds, chỉ sinh cho các lớp đó (dùng cho môn đã học xong).
     */
    private function sinhDiemChoKy(HocKy $hocKy, ?array $chiDinhLopIds = null): void
    {
        $phienBanQuyDoi = app(QuanLyCauHinhService::class)->layApDungChoHocKy($hocKy);
        $trongSo = $phienBanQuyDoi->trong_so;
        $bangQuyDoi = $phienBanQuyDoi->bang_quy_doi;

        $truyVan = DangKyHocPhan::query()
            ->join('lop_hoc_phan', 'lop_hoc_phan.id', '=', 'dang_ky_hoc_phan.lop_hoc_phan_id')
            ->leftJoin('diem', 'diem.dang_ky_hoc_phan_id', '=', 'dang_ky_hoc_phan.id')
            ->where('lop_hoc_phan.hoc_ky_id', $hocKy->id)
            ->where('dang_ky_hoc_phan.trang_thai', DangKyHocPhan::ACTIVE)
            ->whereNull('diem.id');

        if ($chiDinhLopIds !== null) {
            $truyVan->whereIn('lop_hoc_phan.id', $chiDinhLopIds);
        }

        $dangKys = $truyVan->get(['dang_ky_hoc_phan.id']);

        $bayGio = now();
        $rows = [];

        foreach ($dangKys as $dangKy) {
            $cc = random_int(400, 1000) / 100;
            $gk = random_int(350, 1000) / 100;
            $ck = random_int(300, 1000) / 100;
            $tongKet = round(
                $cc * $trongSo['chuyen_can'] + $gk * $trongSo['giua_ky'] + $ck * $trongSo['cuoi_ky'],
                2,
                PHP_ROUND_HALF_UP,
            );

            [$chu, $he4, $xepLoai, $dat] = $this->quyDoi($tongKet, $bangQuyDoi);

            $rows[] = [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'diem_chuyen_can' => $cc,
                'diem_giua_ky' => $gk,
                'diem_cuoi_ky' => $ck,
                'diem_tong_ket' => $tongKet,
                'diem_chu' => $chu,
                'xep_loai' => $xepLoai,
                'quy_doi_diem_id' => $phienBanQuyDoi->id,
                'diem_he_4' => $he4,
                'ket_qua' => $dat ? Diem::DAT : Diem::KHONG_DAT,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        foreach (array_chunk($rows, 200) as $chunk) {
            Diem::query()->insert($chunk);
        }
    }

    /**
     * @return array{0: string, 1: float, 2: string, 3: bool}
     */
    private function quyDoi(float $diem, array $bangQuyDoi): array
    {
        foreach ($bangQuyDoi as $dong) {
            if ($diem >= $dong['tu'] && $diem <= $dong['den']) {
                return [$dong['chu'], $dong['he_4'], $dong['xep_loai'], $dong['dat']];
            }
        }

        throw new LogicException('Bảng quy đổi điểm không bao phủ điểm tổng kết.');
    }
}
