<?php

namespace Database\Seeders;

use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DangKyHocPhanSeeder extends Seeder
{
    /**
     * Đăng ký cho cả hai học kỳ: 2026-1 (đang chạy, 8 lớp/SV) và 2025-2 (đã đóng, 6 lớp/SV).
     */
    public function run(): void
    {
        if (DangKyHocPhan::query()->exists()) {
            return;
        }

        $adminId = User::query()->where('email', 'admin@example.com')->value('id');
        $demoSvId = SinhVien::query()->where('ma_sv', 'SV000000')->value('id');
        $demoSvUserId = User::query()->where('email', 'sinhvien@example.com')->value('id');
        $bayGio = now();

        foreach ([['2026-1', 8], ['2025-2', 6]] as [$maHocKy, $soLopMoiSv]) {
            $hocKy = HocKy::query()->where('ma_hoc_ky', $maHocKy)->firstOrFail();

            $lopTheoMon = LopHocPhan::query()
                ->where('hoc_ky_id', $hocKy->id)
                ->whereIn('trang_thai', [LopHocPhan::OPEN, LopHocPhan::CLOSED])
                ->orderBy('id')
                ->get(['id', 'mon_hoc_id', 'si_so_toi_da']);

            if ($lopTheoMon->isEmpty()) {
                continue;
            }

            $siSo = [];
            foreach ($lopTheoMon as $lop) {
                $siSo[$lop->id] = $lop->si_so_toi_da;
            }

            $sinhVienIds = SinhVien::query()->orderBy('id')->pluck('id')->all();
            $rows = [];
            $soDangKy = [];

            foreach ($sinhVienIds as $viTri => $sinhVienId) {
                $monDaChon = [];
                $batDau = ($viTri * 3) % $lopTheoMon->count();

                for ($buoc = 0; $buoc < $lopTheoMon->count() && count($monDaChon) < $soLopMoiSv; $buoc++) {
                    $lop = $lopTheoMon[($batDau + $buoc) % $lopTheoMon->count()];

                    if (isset($monDaChon[$lop->mon_hoc_id])) {
                        continue;
                    }

                    $daCo = $soDangKy[$lop->id] ?? 0;
                    if ($daCo >= $siSo[$lop->id]) {
                        continue;
                    }

                    $monDaChon[$lop->mon_hoc_id] = true;
                    $soDangKy[$lop->id] = $daCo + 1;

                    $laDemo = $sinhVienId === $demoSvId;

                    $rows[] = [
                        'sinh_vien_id' => $sinhVienId,
                        'lop_hoc_phan_id' => $lop->id,
                        'trang_thai' => DangKyHocPhan::ACTIVE,
                        'dang_ky_boi' => $laDemo ? $demoSvUserId : $adminId,
                        'dang_ky_luc' => $bayGio,
                        'created_at' => $bayGio,
                        'updated_at' => $bayGio,
                    ];
                }
            }

            foreach (array_chunk($rows, 200) as $chunk) {
                DangKyHocPhan::query()->insert($chunk);
            }

            // Dồn lớp đầu tiên của học kỳ đang chạy cho đầy, để có sẵn
            // một ca kiểm chứng SECTION_FULL khi demo.
            if ($maHocKy === '2026-1') {
                $this->lamDayLop($lopTheoMon->first(), $sinhVienIds, $rows, $adminId, $bayGio);
            }
        }
    }

    /**
     * Thêm đăng ký cho tới khi lớp đạt sĩ số tối đa.
     */
    private function lamDayLop(
        LopHocPhan $lop,
        array $sinhVienIds,
        array $daDangKy,
        int $adminId,
        Carbon $bayGio,
    ): void {
        $daCo = DangKyHocPhan::query()
            ->where('lop_hoc_phan_id', $lop->id)
            ->count();

        $canThem = $lop->si_so_toi_da - $daCo;

        if ($canThem <= 0) {
            return;
        }

        $sinhVienDaTrongLop = array_column(
            array_filter($daDangKy, fn (array $r) => $r['lop_hoc_phan_id'] === $lop->id),
            'sinh_vien_id',
        );

        $conLai = array_values(array_diff($sinhVienIds, $sinhVienDaTrongLop));
        $rows = [];

        foreach (array_slice($conLai, 0, $canThem) as $sinhVienId) {
            $rows[] = [
                'sinh_vien_id' => $sinhVienId,
                'lop_hoc_phan_id' => $lop->id,
                'trang_thai' => DangKyHocPhan::ACTIVE,
                'dang_ky_boi' => $adminId,
                'dang_ky_luc' => $bayGio,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        DangKyHocPhan::query()->insert($rows);
    }
}
