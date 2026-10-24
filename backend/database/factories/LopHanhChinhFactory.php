<?php

namespace Database\Factories;

use App\Models\LopHanhChinh;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LopHanhChinh>
 */
class LopHanhChinhFactory extends Factory
{
    public function definition(): array
    {
        $khoaHoc = 'K'.fake()->numberBetween(62, 68);
        $so = fake()->unique()->numberBetween(1, 999);
        $nganh = fake()->randomElement(['CNTT', 'KTPM', 'HTTT', 'ATTT', 'KHMT']);

        return [
            'ma_lop' => sprintf('%s-%s%03d', $nganh, $khoaHoc, $so),
            'ten_lop' => sprintf('Lớp %s-%s%03d', $nganh, $khoaHoc, $so),
            'khoa_hoc' => $khoaHoc,
            'nganh' => $nganh,
            // K65 nhập học 2023, K66 → 2024, ... Cùng công thức với seeder.
            'nam_nhap_hoc' => 2000 + (int) substr($khoaHoc, 1) - 42,
            'mo_ta' => null,
            'trang_thai' => true,
        ];
    }

    public function ngungHoatDong(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => false,
        ]);
    }
}
