<?php

namespace Database\Factories;

use App\Models\GiangVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GiangVien>
 */
class GiangVienFactory extends Factory
{
    public function definition(): array
    {
        $hoTen = fake()->name();

        return [
            'ma_gv' => 'GV'.fake()->unique()->numberBetween(1000, 9999),
            'ho_ten' => $hoTen,
            'email' => fake()->unique()->safeEmail(),
            'so_dien_thoai' => fake()->numerify('09########'),
            'chuyen_mon' => fake()->randomElement([
                'Công nghệ phần mềm',
                'Hệ thống thông tin',
                'Khoa học máy tính',
                'Mạng và truyền thông',
            ]),
            'user_id' => User::factory()->giangVien(),
            'trang_thai' => true,
        ];
    }
}
