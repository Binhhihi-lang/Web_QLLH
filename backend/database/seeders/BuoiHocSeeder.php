<?php

namespace Database\Seeders;

use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\PhongHoc;
use App\Models\TietHoc;
use Illuminate\Database\Seeder;
use RuntimeException;

class BuoiHocSeeder extends Seeder
{
    private const SO_BUOI_MOI_LOP = 17;

    // Mỗi buổi 3 tiết liền nhau — quy ước "2–3 tiết một phòng" của dự án.
    private const KHOI_TIET = [
        [1, 3],
        [4, 6],
        [7, 9],
        [10, 12],
        [13, 15],
    ];

    /**
     * Sinh lịch hàng tuần cho mọi lớp học phần đang mở (khung giờ lấy từ biểu tiết, khác phòng).
     * Chỉ dùng cho dữ liệu demo — nghiệp vụ sinh lịch thật nằm ở ScheduleService (tuần 6).
     */
    public function run(): void
    {
        if (BuoiHoc::query()->exists()) {
            return;
        }

        // Buổi học dùng chung biểu tiết với ca thi, nên đọc bảng thay vì hardcode giờ.
        $tiet = TietHoc::query()->get(['so_tiet', 'gio_bat_dau', 'gio_ket_thuc'])->keyBy('so_tiet');
        if ($tiet->count() !== 15) {
            throw new RuntimeException('Biểu tiết chưa đủ 15 tiết. Chạy TietHocSeeder trước.');
        }

        $khungGio = array_map(fn (array $khoi) => [
            'tiet_bat_dau' => $khoi[0],
            'tiet_ket_thuc' => $khoi[1],
            'gio_bat_dau' => $tiet[$khoi[0]]->gio_bat_dau,
            'gio_ket_thuc' => $tiet[$khoi[1]]->gio_ket_thuc,
        ], self::KHOI_TIET);

        $phongIds = PhongHoc::query()->orderBy('id')->pluck('id')->all();

        $lopHocPhans = LopHocPhan::query()
            ->orderBy('id')
            ->get(['id', 'hoc_ky_id']);

        $ngayBatDauTheoKy = HocKy::query()->pluck('ngay_bat_dau', 'id');

        $bayGio = now();
        $rows = [];
        $soKhung = count($khungGio);

        // Đếm số lớp đã nhận mỗi cặp (học kỳ, thứ, khung tiết). Lớp thứ n của một
        // cặp lấy phòng thứ n, nên hai lớp cùng cặp không bao giờ trùng phòng —
        // lịch demo trông như lịch thật thay vì 4 lớp chen một phòng.
        $daDung = [];

        foreach ($lopHocPhans as $index => $lop) {
            $slot = $index % (5 * $soKhung);
            $thu = 2 + intdiv($slot, $soKhung); // Thứ 2 → Thứ 6
            $khung = $khungGio[$slot % $soKhung];

            $khoa = $lop->hoc_ky_id.'|'.$slot;
            $lanThu = $daDung[$khoa] = ($daDung[$khoa] ?? 0) + 1;
            $phongId = $phongIds[($lanThu - 1) % count($phongIds)];

            // Tuần đầu tiên chứa ngày rơi đúng thứ $thu.
            $ngayDau = $ngayBatDauTheoKy[$lop->hoc_ky_id]->copy();
            while ($ngayDau->dayOfWeekIso !== $thu) {
                $ngayDau->addDay();
            }

            for ($tuan = 0; $tuan < self::SO_BUOI_MOI_LOP; $tuan++) {
                $ngay = $ngayDau->copy()->addWeeks($tuan);
                $daDienRa = $ngay->copy()->setTimeFromTimeString($khung['gio_ket_thuc'])->lt($bayGio);

                $rows[] = [
                    'lop_hoc_phan_id' => $lop->id,
                    'ngay_hoc' => $ngay->toDateString(),
                    'tiet_bat_dau' => $khung['tiet_bat_dau'],
                    'tiet_ket_thuc' => $khung['tiet_ket_thuc'],
                    'gio_bat_dau' => $khung['gio_bat_dau'],
                    'gio_ket_thuc' => $khung['gio_ket_thuc'],
                    'phong_hoc_id' => $phongId,
                    'trang_thai' => $daDienRa ? BuoiHoc::DONE : BuoiHoc::SCHEDULED,
                    // Tất định theo số tuần: chạy lại seeder cho ra cùng kết quả.
                    'hinh_thuc' => $tuan % 10 < 7
                        ? BuoiHoc::HINH_THUC_LY_THUYET
                        : ($tuan % 10 < 9 ? BuoiHoc::HINH_THUC_THUC_HANH : BuoiHoc::HINH_THUC_TRUC_TUYEN),
                    'ly_do_huy' => null,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            BuoiHoc::query()->insert($chunk);
        }
    }
}
