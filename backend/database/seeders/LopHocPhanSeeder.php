<?php

namespace Database\Seeders;

use App\Models\ChuongTrinhDaoTao;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use Illuminate\Database\Seeder;

class LopHocPhanSeeder extends Seeder
{
    /**
     * Lớp học phần sinh THEO CHƯƠNG TRÌNH ĐÀO TẠO, không phải theo số lượng cố định.
     *
     * Số lớp phụ thuộc số môn mỗi kỳ trong chương trình:
     * - 2025-2 (đã đóng): khóa K66, kỳ 1–6
     * - 2026-1 (đang chạy): khóa K67, kỳ 7–10
     * - 2026-2 (sắp tới, mở đợt): khóa K67, kỳ 7–10
     *
     * Giảng viên demo được gán cho mỗi lớp thứ 7 để có đủ dữ liệu test cho vai
     * giảng viên (không còn phụ thuộc danh sách chỉ số cố định).
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

        $gvIds = GiangVien::query()->orderBy('id')->pluck('id')->all();
        $maMonTheoId = MonHoc::query()->pluck('ma_mon', 'id');
        $gvDemoId = $gvDemo?->id;

        $bayGio = now();
        $rows = [];
        $dem = 0;

        // Mở lớp THEO CHƯƠNG TRÌNH ĐÀO TẠO (2026-11-13) thay vì lặp ngẫu nhiên.
        //
        // Vì sao: nghiệp vụ đúng là "chọn chương trình của một khóa, mở cả kỳ cho
        // khóa đó" — các môn đã nằm sẵn trong chương trình khung. Sinh mã lớp
        // `<mã lớp hành chính>-<mã môn>` cho từng môn thuộc đúng kỳ thứ.
        //
        // Hai học kỳ đã qua/đang chạy lấy chương trình của khóa cũ hơn để dữ liệu
        // nhất quán với lớp hành chính đã có.
        $moLopTheoKy = function (HocKy $hocKy, string $khoaHoc, array $kyThus, string $trangThai) use (&$rows, &$dem, $maMonTheoId, $gvIds, $gvDemoId, $bayGio): void {
            $chuongTrinhs = ChuongTrinhDaoTao::query()
                ->with(['nganh', 'mon'])
                ->where('khoa_hoc', $khoaHoc)
                ->where('trang_thai', true)
                ->orderBy('id')
                ->get();

            foreach ($chuongTrinhs as $ct) {
                $lopHanhChinh = LopHanhChinh::query()
                    ->where('nganh_id', $ct->nganh_id)
                    ->where('khoa_hoc', $khoaHoc)
                    ->orderBy('ma_lop')
                    ->first();

                if ($lopHanhChinh === null) {
                    continue;
                }

                $monTrongKy = $ct->mon->filter(fn ($m) => in_array($m->ky_thu, $kyThus, true));

                foreach ($monTrongKy as $dong) {
                    $maMon = $maMonTheoId[$dong->mon_hoc_id] ?? null;
                    if ($maMon === null) {
                        continue;
                    }

                    $dem++;
                    $rows[] = [
                        'ma_lop_hp' => sprintf('%s-%s', $lopHanhChinh->ma_lop, $maMon),
                        'mon_hoc_id' => $dong->mon_hoc_id,
                        'hoc_ky_id' => $hocKy->id,
                        'giang_vien_id' => ($gvDemoId !== null && $dem % 7 === 0)
                            ? $gvDemoId
                            : $gvIds[($dem - 1) % count($gvIds)],
                        'si_so_toi_da' => [60, 70, 80, 90][$dem % 4],
                        'trang_thai' => $trangThai,
                        'created_at' => $bayGio,
                        'updated_at' => $bayGio,
                    ];
                }
            }
        };

        // 2025-2 (đã đóng): khóa K66, kỳ 1–6 của chương trình.
        $moLopTheoKy($hocKyDaDong, 'K66', [1, 2, 3, 4, 5, 6], LopHocPhan::CLOSED);
        // 2026-1 (đang chạy): khóa K67, kỳ 7–10.
        $moLopTheoKy($hocKyDangDienRa, 'K67', [7, 8, 9, 10], LopHocPhan::CLOSED);
        // 2026-2 (sắp tới, đang mở đợt): khóa K67, kỳ 7–10 — lớp OPEN để đăng ký.
        $moLopTheoKy($hocKySapToi, 'K67', [7, 8, 9, 10], LopHocPhan::OPEN);

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
            // Gán giảng viên demo cho một phần lớp của kỳ đang chạy để có dữ liệu
            // test cho vai giảng viên. Mỗi lớp thứ 7, giống cách `run()` làm.
            $idCuaGvDemo = LopHocPhan::query()
                ->where('hoc_ky_id', $hocKyDangDienRa->id)
                ->orderBy('id')
                ->pluck('id')
                ->filter(fn ($id, $viTri) => ($viTri + 1) % 7 === 0)
                ->values()
                ->all();

            if ($idCuaGvDemo !== []) {
                LopHocPhan::query()
                    ->whereIn('id', $idCuaGvDemo)
                    ->update(['giang_vien_id' => $gvDemo->id]);
            }
        }
    }
}
