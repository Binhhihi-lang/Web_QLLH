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
                ['tu' => 8.5, 'den' => 10.0, 'chu' => 'A', 'he_4' => 4.0, 'dat' => true],
                ['tu' => 7.0, 'den' => 8.49, 'chu' => 'B', 'he_4' => 3.0, 'dat' => true],
                ['tu' => 5.5, 'den' => 6.99, 'chu' => 'C', 'he_4' => 2.0, 'dat' => true],
                ['tu' => 4.0, 'den' => 5.49, 'chu' => 'D', 'he_4' => 1.0, 'dat' => true],
                ['tu' => 0.0, 'den' => 3.99, 'chu' => 'F', 'he_4' => 0.0, 'dat' => false],
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
