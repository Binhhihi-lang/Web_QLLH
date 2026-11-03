<?php

namespace Database\Factories;

use App\Models\Khoa;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Khoa>
 */
class KhoaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ma_khoa' => strtoupper(fake()->unique()->bothify('KH###')),
            'ten_khoa' => 'Khoa '.fake()->words(2, true),
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
