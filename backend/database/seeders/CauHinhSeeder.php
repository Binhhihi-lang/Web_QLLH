<?php

namespace Database\Seeders;

use App\Models\CauHinh;
use Illuminate\Database\Seeder;

class CauHinhSeeder extends Seeder
{
    public function run(): void
    {
        CauHinh::dat(
            'diem.trong_so',
            ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.50],
            'Trọng số điểm thành phần (tổng = 1.0)',
        );

        CauHinh::dat(
            'diem.bang_quy_doi',
            [
                ['tu' => 8.5, 'den' => 10.0, 'chu' => 'A', 'he_4' => 4.0, 'xep_loai' => 'Giỏi', 'dat' => true],
                ['tu' => 8.0, 'den' => 8.49, 'chu' => 'B+', 'he_4' => 3.5, 'xep_loai' => 'Khá giỏi', 'dat' => true],
                ['tu' => 7.0, 'den' => 7.99, 'chu' => 'B', 'he_4' => 3.0, 'xep_loai' => 'Khá', 'dat' => true],
                ['tu' => 6.5, 'den' => 6.99, 'chu' => 'C+', 'he_4' => 2.5, 'xep_loai' => 'Trung bình khá', 'dat' => true],
                ['tu' => 5.5, 'den' => 6.49, 'chu' => 'C', 'he_4' => 2.0, 'xep_loai' => 'Trung bình', 'dat' => true],
                ['tu' => 5.0, 'den' => 5.49, 'chu' => 'D+', 'he_4' => 1.5, 'xep_loai' => 'Trung bình yếu', 'dat' => true],
                ['tu' => 4.0, 'den' => 4.99, 'chu' => 'D', 'he_4' => 1.0, 'xep_loai' => 'Yếu', 'dat' => true],
                ['tu' => 0.0, 'den' => 3.99, 'chu' => 'F', 'he_4' => 0.0, 'xep_loai' => 'Kém (không đạt)', 'dat' => false],
            ],
            'Bảng quy đổi điểm chữ và điểm hệ 4 theo quy chế trường',
        );

        CauHinh::dat(
            'diem.diem_danh.sua_trong_so_ngay',
            7,
            'Số ngày được phép sửa điểm danh sau buổi học',
        );
    }
}
