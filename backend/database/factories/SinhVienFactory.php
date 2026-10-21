<?php

namespace Database\Factories;

use App\Models\LopHoc;
use App\Models\SinhVien;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SinhVien>
 */
class SinhVienFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ma_sv'         => strtoupper(fake()->unique()->bothify('SV####')),
            'ho_ten'        => fake()->name(),
            'email'         => fake()->unique()->safeEmail(),
            'ngay_sinh'     => fake()->dateTimeBetween('-25 years', '-18 years')->format('Y-m-d'),
            'gioi_tinh'     => fake()->boolean(),
            // Nếu chưa có lớp nào thì tạo luôn một lớp mới.
            'lop_hoc_id'    => LopHoc::factory(),
            'so_dien_thoai' => fake()->optional()->numerify('09########'),
            'dia_chi'       => fake()->optional()->address(),
            'trang_thai'    => true,
        ];
    }

    /**
     * Sinh viên chưa được xếp lớp.
     */
    public function chuaCoLop(): static
    {
        return $this->state(fn (array $attributes) => [
            'lop_hoc_id' => null,
        ]);
    }
}
