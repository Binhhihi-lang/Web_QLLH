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
        $khoa = 'K'.fake()->numberBetween(62, 68);
        $so = fake()->unique()->numberBetween(1, 999);

        return [
            'ma_lop' => sprintf('%s%03d', $khoa, $so),
            'ten_lop' => sprintf('Lớp %s-%03d', $khoa, $so),
            'khoa' => $khoa,
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
