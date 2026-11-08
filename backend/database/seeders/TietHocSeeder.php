<?php

namespace Database\Seeders;

use App\Models\TietHoc;
use Illuminate\Database\Seeder;

/**
 * Biểu tiết 15 tiết/ngày theo quy định của trường (mỗi tiết 50 phút).
 * Sáng tiết 1–6, chiều 7–12, tối 13–15.
 */
class TietHocSeeder extends Seeder
{
    private const BIEU_TIET = [
        [1, TietHoc::SANG, '06:30', '07:20'],
        [2, TietHoc::SANG, '07:25', '08:15'],
        [3, TietHoc::SANG, '08:20', '09:10'],
        [4, TietHoc::SANG, '09:20', '10:10'],
        [5, TietHoc::SANG, '10:15', '11:05'],
        [6, TietHoc::SANG, '11:10', '12:00'],
        [7, TietHoc::CHIEU, '12:30', '13:20'],
        [8, TietHoc::CHIEU, '13:25', '14:15'],
        [9, TietHoc::CHIEU, '14:20', '15:10'],
        [10, TietHoc::CHIEU, '15:20', '16:10'],
        [11, TietHoc::CHIEU, '16:15', '17:05'],
        [12, TietHoc::CHIEU, '17:10', '18:00'],
        [13, TietHoc::TOI, '18:15', '19:05'],
        [14, TietHoc::TOI, '19:10', '20:00'],
        [15, TietHoc::TOI, '20:05', '20:55'],
    ];

    public function run(): void
    {
        if (TietHoc::query()->exists()) {
            return;
        }

        $bayGio = now();

        TietHoc::query()->insert(array_map(
            fn (array $dong) => [
                'so_tiet' => $dong[0],
                'ca' => $dong[1],
                'gio_bat_dau' => $dong[2],
                'gio_ket_thuc' => $dong[3],
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ],
            self::BIEU_TIET,
        ));
    }
}
