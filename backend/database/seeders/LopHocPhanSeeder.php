<?php

namespace Database\Seeders;

use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use Illuminate\Database\Seeder;

class LopHocPhanSeeder extends Seeder
{
    // Các mã thứ tự lớp ($dem) gán cố định cho giảng viên demo (giangvien@example.com)
    // trải đều cả 3 học kỳ: 2026-1 (1..80), 2025-2 (81..120), 2026-2 (121..150).
    private const LOP_CUA_GV_DEMO = [1, 2, 61, 62, 63, 81, 82, 101, 102, 121, 122, 123];

    /**
     * 150 lớp học phần: 80 thuộc 2026-1 (đang diễn ra), 40 thuộc 2025-2 (đã đóng),
     * 30 thuộc 2026-2 (sắp diễn ra, đang mở đợt đăng ký).
     */
    public function run(): void
    {
        $hocKyDangDienRa = HocKy::query()->where('ma_hoc_ky', '2026-1')->firstOrFail();
        $hocKyDaDong = HocKy::query()->where('ma_hoc_ky', '2025-2')->firstOrFail();
        $hocKySapToi = HocKy::query()->where('ma_hoc_ky', '2026-2')->firstOrFail();
        $gvDemo = GiangVien::query()->where('email', 'giangvien@example.com')->first();

        if (LopHocPhan::query()->exists()) {
            $this->dongBoDuLieuHienCo($hocKyDaDong, $hocKyDangDienRa, $hocKySapToi, $gvDemo);

            return;
        }

        $monIds = MonHoc::query()->orderBy('id')->pluck('id')->all();
        $gvIds = GiangVien::query()->orderBy('id')->pluck('id')->all();

        $bayGio = now();
        $rows = [];
        $dem = 0;

        foreach ([$hocKyDangDienRa->id => 80, $hocKyDaDong->id => 40, $hocKySapToi->id => 30] as $hocKyId => $soLuong) {
            for ($i = 1; $i <= $soLuong; $i++) {
                $dem++;
                $rows[] = [
                    'ma_lop_hp' => sprintf('LHP%04d', $dem),
                    'mon_hoc_id' => $monIds[($dem - 1) % count($monIds)],
                    'hoc_ky_id' => $hocKyId,
                    'giang_vien_id' => ($gvDemo && in_array($dem, self::LOP_CUA_GV_DEMO, true))
                        ? $gvDemo->id
                        : $gvIds[($dem - 1) % count($gvIds)],
                    'si_so_toi_da' => [60, 70, 80, 90][$dem % 4],
                    // Cứ 5 lớp thì 1 lớp dành riêng cho một năm thứ (BR-23);
                    // còn lại null = mọi năm, giống môn đại cương.
                    'nam_thu' => $dem % 5 === 0 ? (($dem / 5) % 4) + 1 : null,
                    'trang_thai' => ($hocKyId === $hocKyDaDong->id || $hocKyId === $hocKyDangDienRa->id)
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

    private function dongBoDuLieuHienCo(
        HocKy $hocKyDaDong,
        HocKy $hocKyDangDienRa,
        HocKy $hocKySapToi,
        ?GiangVien $gvDemo,
    ): void {
        LopHocPhan::query()
            ->whereIn('hoc_ky_id', [$hocKyDaDong->id, $hocKyDangDienRa->id])
            ->update(['trang_thai' => LopHocPhan::CLOSED]);

        LopHocPhan::query()
            ->where('hoc_ky_id', $hocKySapToi->id)
            ->update(['trang_thai' => LopHocPhan::OPEN]);

        if ($gvDemo !== null) {
            $maLopDemo = array_map(fn (int $so) => sprintf('LHP%04d', $so), self::LOP_CUA_GV_DEMO);
            LopHocPhan::query()
                ->whereIn('ma_lop_hp', $maLopDemo)
                ->update(['giang_vien_id' => $gvDemo->id]);
        }
    }
}
