<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LopHoc;

class LopHocSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        // Tạo 10 lớp học, dữ liệu hoàn toàn ngẫu nhiên từ Factory
        // Dùng mã lớp cố định để có thể chạy seeder nhiều lần mà không tạo trùng.
        for ($i = 1; $i <= 20; $i++) {
            $maLop = sprintf('DEMO-LH-%03d', $i);

            LopHoc::updateOrCreate(
                ['ma_lop' => $maLop],
                [
                    'ten_lop' => sprintf('Lớp mẫu %02d', $i),
                    'giao_vien' => 'Giáo viên mẫu ' . (($i - 1) % 5 + 1),
                    'ghi_chu' => 'Dữ liệu mẫu để thực hành phân trang.',
                    'si_so' => 20 + (($i * 7) % 31),
                    'trang_thai' => true,
                ]
            );
        }
    }
}
