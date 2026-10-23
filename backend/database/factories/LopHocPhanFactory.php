<?php

namespace Database\Factories;

use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LopHocPhan>
 */
class LopHocPhanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ma_lop_hp' => 'LHP'.fake()->unique()->numerify('#####'),
            'mon_hoc_id' => MonHoc::factory(),
            'hoc_ky_id' => HocKy::factory(),
            'giang_vien_id' => GiangVien::factory(),
            'si_so_toi_da' => fake()->randomElement([30, 40, 50, 60]),
            'trang_thai' => LopHocPhan::OPEN,
            'chot_diem_luc' => null,
            'chot_diem_boi' => null,
        ];
    }

    public function daDong(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => LopHocPhan::CLOSED,
        ]);
    }

    public function daChotDiem(): static
    {
        return $this->state(fn (array $attributes) => [
            'chot_diem_luc' => now(),
        ]);
    }
}
