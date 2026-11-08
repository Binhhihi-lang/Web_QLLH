<?php

namespace Database\Seeders;

use App\Models\HocKy;
use App\Models\LichThi;
use App\Models\MonHoc;
use App\Models\PhongHoc;
use App\Models\TietHoc;
use Illuminate\Database\Seeder;

class LichThiSeeder extends Seeder
{
    // Ca thi 2 tiết liền nhau, gọn trong một ca (sáng/chiều/tối).
    private const CAP_TIET = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12], [13, 14]];

    private const CAC_HOC_KY = ['2025-2', '2026-1', '2026-2'];

    /**
     * Ca thi demo cho cả 3 học kỳ. Ngày thi rơi vào 2 tuần cuối kỳ (giai đoạn thi)
     * và môn thi lấy từ lớp học phần của kỳ để lịch thi của sinh viên khớp môn đã đăng ký.
     */
    public function run(): void
    {
        if (LichThi::query()->exists()) {
            return;
        }

        // Cùng quy tắc với QuanLyLichThiService::khungGio(): giờ bắt đầu của tiết đầu,
        // giờ kết thúc của tiết cuối, định dạng H:i:s.
        $tiet = TietHoc::query()->get(['so_tiet', 'gio_bat_dau', 'gio_ket_thuc'])->keyBy('so_tiet');
        $phongIds = PhongHoc::query()->where('trang_thai', true)->orderBy('id')->pluck('id')->all();

        // Thiếu biểu tiết hoặc phòng thì không xếp được ca nào.
        if ($tiet->isEmpty() || $phongIds === []) {
            return;
        }

        $khungGio = array_map(fn (array $cap) => [
            'tiet_bat_dau' => $cap[0],
            'tiet_ket_thuc' => $cap[1],
            'gio_bat_dau' => $tiet[$cap[0]]->gio_bat_dau,
            'gio_ket_thuc' => $tiet[$cap[1]]->gio_ket_thuc,
        ], self::CAP_TIET);

        $hocKys = HocKy::query()
            ->whereIn('ma_hoc_ky', self::CAC_HOC_KY)
            ->orderBy('ngay_bat_dau')
            ->get();

        $bayGio = now();
        $rows = [];
        $chiSoPhong = 0;      // xoay vòng phòng để các ca không dồn một phòng
        $daDungPhong = [];    // "ngay|tiet_bat_dau" => [phong_hoc_id]

        foreach ($hocKys as $hocKy) {
            $monIds = $this->monCuaHocKy($hocKy);
            if ($monIds === []) {
                continue;
            }

            shuffle($monIds);
            $soCa = min(count($monIds), random_int(12, 20));
            $ngayUngVien = $this->ngayThi($hocKy);

            for ($i = 0; $i < $soCa; $i++) {
                $ngay = $ngayUngVien[$i % count($ngayUngVien)];
                $khung = $khungGio[$i % count($khungGio)];
                $khoa = $ngay.'|'.$khung['tiet_bat_dau'];

                $phongId = null;
                for ($thu = 0; $thu < count($phongIds); $thu++) {
                    $ungVien = $phongIds[($chiSoPhong + $thu) % count($phongIds)];
                    if (! in_array($ungVien, $daDungPhong[$khoa] ?? [], true)) {
                        $phongId = $ungVien;
                        $chiSoPhong = ($chiSoPhong + $thu + 1) % count($phongIds);
                        break;
                    }
                }

                if ($phongId === null) {
                    continue; // hết phòng trống cho khung này, bỏ ca
                }

                $daDungPhong[$khoa][] = $phongId;

                $rows[] = [
                    'hoc_ky_id' => $hocKy->id,
                    'mon_hoc_id' => $monIds[$i],
                    'ngay_thi' => $ngay,
                    'tiet_bat_dau' => $khung['tiet_bat_dau'],
                    'tiet_ket_thuc' => $khung['tiet_ket_thuc'],
                    'gio_bat_dau' => $khung['gio_bat_dau'],
                    'gio_ket_thuc' => $khung['gio_ket_thuc'],
                    'phong_hoc_id' => $phongId,
                    'dot_thi' => $i % 2 === 0 ? 'Giữa kỳ' : 'Cuối kỳ',
                    'ghi_chu' => null,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            LichThi::query()->insert($chunk);
        }
    }

    /**
     * Môn đang hoạt động có lớp học phần trong kỳ. Kỳ chưa mở lớp (2026-2) thì
     * lấy toàn bộ môn đang hoạt động — lịch thi thường công bố trước khi có lớp.
     *
     * @return list<int>
     */
    private function monCuaHocKy(HocKy $hocKy): array
    {
        $monIds = $hocKy->lopHocPhan()
            ->join('mon_hoc', 'mon_hoc.id', '=', 'lop_hoc_phan.mon_hoc_id')
            ->where('mon_hoc.trang_thai', true)
            ->distinct()
            ->pluck('mon_hoc.id')
            ->all();

        if ($monIds === []) {
            $monIds = MonHoc::query()->where('trang_thai', true)->orderBy('id')->pluck('id')->all();
        }

        return $monIds;
    }

    /**
     * Các ngày thi ứng viên trong 2 tuần cuối học kỳ, bỏ Chủ nhật.
     *
     * @return list<string>
     */
    private function ngayThi(HocKy $hocKy): array
    {
        $ngay = $hocKy->ngay_ket_thuc->copy()->subDays(13);
        $ketThuc = $hocKy->ngay_ket_thuc->copy();

        $ngayUngVien = [];
        while ($ngay->lte($ketThuc)) {
            if ($ngay->dayOfWeekIso !== 7) {
                $ngayUngVien[] = $ngay->toDateString();
            }
            $ngay->addDay();
        }

        return $ngayUngVien;
    }
}
