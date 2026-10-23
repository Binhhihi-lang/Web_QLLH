<?php

namespace Database\Factories;

use App\Models\LopHanhChinh;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SinhVien>
 */
class SinhVienFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ma_sv' => 'SV'.fake()->unique()->numerify('######'),
            'ho_ten' => fake()->name(),
            'ngay_sinh' => fake()->dateTimeBetween('-25 years', '-18 years')->format('Y-m-d'),
            'gioi_tinh' => fake()->boolean(),
            'email' => fake()->unique()->safeEmail(),
            'so_dien_thoai' => fake()->numerify('09########'),
            'dia_chi' => fake()->address(),
            'lop_hanh_chinh_id' => LopHanhChinh::factory(),
            'user_id' => User::factory()->sinhVien(),
            'trang_thai' => true,
        ];
    }
}
