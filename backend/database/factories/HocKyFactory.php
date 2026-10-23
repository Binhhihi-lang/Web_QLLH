<?php

namespace Database\Factories;

use App\Models\HocKy;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HocKy>
 */
class HocKyFactory extends Factory
{
    public function definition(): array
    {
        $nam = fake()->numberBetween(2025, 2027);
        $ky = fake()->numberBetween(1, 2);
        $batDau = now()->setDate($nam, $ky === 1 ? 1 : 8, 15)->startOfDay();

        return [
            'ma_hoc_ky' => $nam.'-'.$ky,
            'ten_hoc_ky' => sprintf('Học kỳ %d năm %d', $ky, $nam),
            'ngay_bat_dau' => $batDau->toDateString(),
            'ngay_ket_thuc' => $batDau->copy()->addMonths(4)->toDateString(),
            'mo_dang_ky_luc' => $batDau->copy()->subWeeks(2),
            'dong_dang_ky_luc' => $batDau->copy()->subWeek(),
            'trang_thai' => HocKy::UPCOMING,
        ];
    }

    public function dangDienRa(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => HocKy::ONGOING,
            'mo_dang_ky_luc' => now()->subMonth(),
            'dong_dang_ky_luc' => now()->addMonth(),
        ]);
    }

    public function daDong(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => HocKy::CLOSED,
            'ngay_bat_dau' => now()->subYear()->toDateString(),
            'ngay_ket_thuc' => now()->subMonths(8)->toDateString(),
            'mo_dang_ky_luc' => now()->subYear()->subWeeks(2),
            'dong_dang_ky_luc' => now()->subYear(),
        ]);
    }
}
