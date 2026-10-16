<?php

namespace Database\Factories;

use App\Models\LopHoc;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LopHoc>
 */
class LopHocFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ten_lop'    => 'Lớp ' . fake()->word(),
            'ma_lop'     => strtoupper(fake()->unique()->bothify('LH###')),
            'giao_vien'  => fake()->name(),
            'so_dien_thoai_gvcn' => fake()->optional()->numerify('09########'),
            'ghi_chu'    => fake()->optional()->sentence(),
            'si_so'      => fake()->numberBetween(20, 100),
            'trang_thai' => fake()->boolean(),
        ];
    }

    /**
     * Lớp đang hoạt động.
     */
    public function dangHoatDong(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => true,
        ]);
    }
}
