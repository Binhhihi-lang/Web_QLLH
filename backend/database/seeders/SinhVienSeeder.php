<?php

namespace Database\Seeders;

use App\Models\LopHoc;
use App\Models\SinhVien;
use Illuminate\Database\Seeder;

class SinhVienSeeder extends Seeder
{
    /**
     * Seed a repeatable set of students for pagination practice.
     */
    public function run(): void
    {
        // Cho phép chạy riêng SinhVienSeeder mà vẫn có lớp để gắn sinh viên vào.
        $this->call(LopHocSeeder::class);

        $lopHocIds = LopHoc::query()
            ->where('ma_lop', 'like', 'DEMO-LH-%')
            ->orderBy('ma_lop')
            ->pluck('id')
            ->all();

        $hoTenMau = [
            'Nguyễn An',
            'Trần Bình',
            'Lê Chi',
            'Phạm Dũng',
            'Hoàng Giang',
            'Võ Hà',
            'Đặng Khánh',
            'Bùi Linh',
            'Đỗ Minh',
            'Phan Ngọc',
        ];

        for ($i = 1; $i <= 50; $i++) {
            $maSinhVien = sprintf('DEMO-SV-%04d', $i);

            SinhVien::updateOrCreate(
                ['ma_sv' => $maSinhVien],
                [
                    'ho_ten' => $hoTenMau[($i - 1) % count($hoTenMau)] . ' ' . $i,
                    'email' => sprintf('demo.sv%03d@example.test', $i),
                    'ngay_sinh' => sprintf('%04d-%02d-%02d', 2000 + ($i % 6), ($i % 12) + 1, ($i % 28) + 1),
                    'gioi_tinh' => $i % 2 === 1,
                    'lop_hoc_id' => $lopHocIds[($i - 1) % count($lopHocIds)],
                    'so_dien_thoai' => sprintf('09%08d', $i),
                    'dia_chi' => sprintf('Địa chỉ mẫu số %02d', $i),
                    'trang_thai' => true,
                ]
            );
        }
    }
}
