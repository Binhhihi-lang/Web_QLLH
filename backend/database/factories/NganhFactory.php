<?php

namespace Database\Factories;

use App\Models\Khoa;
use App\Models\Nganh;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Nganh>
 */
class NganhFactory extends Factory
{
    public function definition(): array
    {
        return [
            'khoa_id' => Khoa::factory(),
            'ma_nganh' => strtoupper(fake()->unique()->bothify('NG###')),
            'ten_nganh' => 'Ngành '.fake()->unique()->words(2, true),
            'mo_ta' => null,
            'trang_thai' => true,
        ];
    }

    public function thuocKhoa(Khoa $khoa): static
    {
        return $this->state(fn (array $attributes) => [
            'khoa_id' => $khoa->id,
        ]);
    }

    public function ngungHoatDong(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => false,
        ]);
    }
}
