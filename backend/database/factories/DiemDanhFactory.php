<?php

namespace Database\Factories;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\DiemDanh;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiemDanh>
 */
class DiemDanhFactory extends Factory
{
    public function definition(): array
    {
        return [
            'buoi_hoc_id' => BuoiHoc::factory(),
            'dang_ky_hoc_phan_id' => DangKyHocPhan::factory(),
            'trang_thai' => fake()->randomElement([
                DiemDanh::PRESENT,
                DiemDanh::PRESENT,
                DiemDanh::PRESENT,
                DiemDanh::LATE,
                DiemDanh::ABSENT,
                DiemDanh::EXCUSED,
            ]),
            'ghi_chu' => null,
            'diem_danh_boi' => User::factory()->giangVien(),
            'diem_danh_luc' => now(),
        ];
    }
}
