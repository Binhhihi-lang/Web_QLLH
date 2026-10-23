<?php

namespace Database\Factories;

use App\Models\DangKyHocPhan;
use App\Models\Diem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Diem>
 */
class DiemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'dang_ky_hoc_phan_id' => DangKyHocPhan::factory(),
            'diem_chuyen_can' => null,
            'diem_giua_ky' => null,
            'diem_cuoi_ky' => null,
            'diem_tong_ket' => null,
            'diem_chu' => null,
            'diem_he_4' => null,
            'ket_qua' => null,
        ];
    }

    /**
     * Sinh đủ 3 điểm thành phần và tính tổng kết theo công thức 25/25/50.
     */
    public function duDiem(): static
    {
        return $this->state(function (array $attributes) {
            $cc = fake()->randomFloat(2, 4, 10);
            $gk = fake()->randomFloat(2, 3, 10);
            $ck = fake()->randomFloat(2, 3, 10);
            $tongKet = round($cc * 0.25 + $gk * 0.25 + $ck * 0.50, 2);

            return [
                'diem_chuyen_can' => $cc,
                'diem_giua_ky' => $gk,
                'diem_cuoi_ky' => $ck,
                'diem_tong_ket' => $tongKet,
            ];
        });
    }
}
