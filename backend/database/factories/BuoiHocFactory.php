<?php

namespace Database\Factories;

use App\Models\BuoiHoc;
use App\Models\LopHocPhan;
use App\Models\PhongHoc;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BuoiHoc>
 */
class BuoiHocFactory extends Factory
{
    public function definition(): array
    {
        $gioBatDau = fake()->randomElement(['07:00', '09:30', '13:00', '15:30']);

        return [
            'lop_hoc_phan_id' => LopHocPhan::factory(),
            'ngay_hoc' => fake()->dateTimeBetween('-2 months', '+2 months')->format('Y-m-d'),
            'gio_bat_dau' => $gioBatDau,
            'gio_ket_thuc' => date('H:i', strtotime($gioBatDau.' +90 minutes')),
            'phong_hoc_id' => PhongHoc::factory(),
            'trang_thai' => BuoiHoc::SCHEDULED,
            'ly_do_huy' => null,
        ];
    }

    public function daDienRa(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => BuoiHoc::DONE,
            'ngay_hoc' => now()->subWeek()->toDateString(),
        ]);
    }

    public function daHuy(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => BuoiHoc::CANCELLED,
            'ly_do_huy' => 'Giảng viên bận đột xuất',
        ]);
    }
}
