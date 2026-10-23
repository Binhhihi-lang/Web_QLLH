<?php

namespace Database\Factories;

use App\Models\CauHinh;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CauHinh>
 */
class CauHinhFactory extends Factory
{
    public function definition(): array
    {
        return [
            'khoa' => 'cau.hinh.'.fake()->unique()->word(),
            'gia_tri' => ['gia_tri' => fake()->word()],
            'mo_ta' => fake()->sentence(),
        ];
    }
}
