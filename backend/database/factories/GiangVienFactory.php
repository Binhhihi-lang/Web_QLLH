<?php

namespace Database\Factories;

use App\Models\GiangVien;
use App\Models\Nganh;
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
            // Dùng lại ngành có sẵn nếu có để test không sinh thêm khoa/ngành mỗi dòng.
            'nganh_id' => fn () => Nganh::query()->value('id') ?? Nganh::factory()->create()->id,
            'user_id' => User::factory()->giangVien(),
            'trang_thai' => true,
        ];
    }
}
