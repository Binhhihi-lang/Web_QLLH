<?php

namespace Database\Factories;

use App\Models\DangKyHocPhan;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DangKyHocPhan>
 */
class DangKyHocPhanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sinh_vien_id' => SinhVien::factory(),
            'lop_hoc_phan_id' => LopHocPhan::factory(),
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_boi' => User::factory()->sinhVien(),
            'dang_ky_luc' => now(),
            'huy_boi' => null,
            'huy_luc' => null,
            'ly_do_huy' => null,
        ];
    }

    public function daHuy(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => DangKyHocPhan::CANCELLED,
            'huy_boi' => User::factory()->sinhVien(),
            'huy_luc' => now(),
            'ly_do_huy' => 'Sinh viên tự hủy',
        ]);
    }
}
