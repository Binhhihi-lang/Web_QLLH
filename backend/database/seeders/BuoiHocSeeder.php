<?php

namespace Database\Seeders;

use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\PhongHoc;
use Illuminate\Database\Seeder;

class BuoiHocSeeder extends Seeder
{
    private const SO_BUOI_MOI_LOP = 17;

    /**
     * Sinh lịch hàng tuần cho mọi lớp học phần đang mở (khung giờ cố định, khác phòng).
     * Chỉ dùng cho dữ liệu demo — nghiệp vụ sinh lịch thật nằm ở ScheduleService (tuần 6).
     */
    public function run(): void
    {
        if (BuoiHoc::query()->exists()) {
            return;
        }

        $khungGio = [
            ['07:00', '08:30'],
            ['09:30', '11:00'],
            ['13:00', '14:30'],
            ['15:30', '17:00'],
        ];

        $phongIds = PhongHoc::query()->orderBy('id')->pluck('id')->all();

        $lopHocPhans = LopHocPhan::query()
            ->orderBy('id')
            ->get(['id', 'hoc_ky_id']);

        $ngayBatDauTheoKy = HocKy::query()->pluck('ngay_bat_dau', 'id');

        $bayGio = now();
        $rows = [];
        $index = 0;

        foreach ($lopHocPhans as $lop) {
            $thu = ($index % 5) + 2; // Thứ 2 → Thứ 6
            $khung = $khungGio[$index % 4];
            $phongId = $phongIds[$index % count($phongIds)];

            // Tuần đầu tiên chứa ngày rơi đúng thứ $thu.
            $ngayDau = $ngayBatDauTheoKy[$lop->hoc_ky_id]->copy();
            while ($ngayDau->dayOfWeekIso !== $thu) {
                $ngayDau->addDay();
            }

            for ($tuan = 0; $tuan < self::SO_BUOI_MOI_LOP; $tuan++) {
                $ngay = $ngayDau->copy()->addWeeks($tuan);
                $daDienRa = $ngay->copy()->setTimeFromTimeString($khung[1])->lt($bayGio);

                $rows[] = [
                    'lop_hoc_phan_id' => $lop->id,
                    'ngay_hoc' => $ngay->toDateString(),
                    'gio_bat_dau' => $khung[0],
                    'gio_ket_thuc' => $khung[1],
                    'phong_hoc_id' => $phongId,
                    'trang_thai' => $daDienRa ? BuoiHoc::DONE : BuoiHoc::SCHEDULED,
                    'ly_do_huy' => null,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }

            $index++;
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            BuoiHoc::query()->insert($chunk);
        }
    }
}
