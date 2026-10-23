<?php

namespace Database\Factories;

use App\Models\MonHoc;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MonHoc>
 */
class MonHocFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ma_mon' => 'MH'.fake()->unique()->numberBetween(1000, 9999),
            'ten_mon' => fake()->randomElement([
                'Lập trình hướng đối tượng',
                'Cấu trúc dữ liệu và giải thuật',
                'Cơ sở dữ liệu',
                'Mạng máy tính',
                'Hệ điều hành',
                'Phân tích thiết kế hệ thống',
                'Lập trình web',
                'Trí tuệ nhân tạo',
                'Toán rời rạc',
                'Kiến trúc máy tính',
            ]).' '.fake()->randomElement(['1', '2', 'nâng cao']),
            'so_tin_chi' => fake()->numberBetween(2, 4),
            'mo_ta' => null,
            'trang_thai' => true,
        ];
    }
}
