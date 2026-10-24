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
        // ma_hoc_ky là unique, mà không gian giá trị chỉ có 6 tổ hợp
        // (2025..2027 × 2 kỳ) nên fake() ngẫu nhiên sẽ trùng khi tạo nhiều
        // bản ghi trong cùng một test. Dùng unique() để cấp phát tuần tự.
        $chiSo = fake()->unique()->numberBetween(0, 5);
        $nam = 2025 + intdiv($chiSo, 2);
        $ky = ($chiSo % 2) + 1;
        $batDau = now()->setDate($nam, $ky === 1 ? 1 : 8, 15)->startOfDay();

        return [
            'ma_hoc_ky' => $nam.'-'.$ky,
            'ten_hoc_ky' => sprintf('Học kỳ %d năm %d-%d', $ky, $nam, $nam + 1),
            // Học kỳ 1 thuộc năm học bắt đầu từ $nam; học kỳ 2 cũng vậy
            // (HK2 của năm học 2026-2027 diễn ra đầu 2027).
            'nam_hoc' => $nam.'-'.($nam + 1),
            'ky_thu' => $ky,
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
