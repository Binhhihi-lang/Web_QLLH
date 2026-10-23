<?php

namespace Database\Factories;

use App\Models\PhongHoc;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PhongHoc>
 */
class PhongHocFactory extends Factory
{
    public function definition(): array
    {
        $toa = fake()->randomElement(['A', 'B', 'C']);
        $so = fake()->unique()->numberBetween(101, 510);

        return [
            'ma_phong' => sprintf('%s%03d', $toa, $so),
            'ten_phong' => sprintf('Phòng %s%03d', $toa, $so),
            'suc_chua' => fake()->randomElement([30, 40, 50, 60, 80, 100]),
            'trang_thai' => true,
        ];
    }
}
