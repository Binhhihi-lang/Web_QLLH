<?php

namespace Database\Factories;

use App\Models\Diem;
use App\Models\LichSuDiem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LichSuDiem>
 */
class LichSuDiemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'diem_id' => Diem::factory(),
            'truong' => fake()->randomElement([
                'diem_chuyen_can',
                'diem_giua_ky',
                'diem_cuoi_ky',
                'diem_tong_ket',
                'diem_chu',
                'diem_he_4',
                'ket_qua',
            ]),
            'gia_tri_cu' => fake()->randomFloat(2, 0, 10),
            'gia_tri_moi' => fake()->randomFloat(2, 0, 10),
            'nguoi_sua_id' => User::factory()->giangVien(),
            'ly_do' => 'Sửa điểm theo yêu cầu phúc khảo',
            'thoi_diem' => now(),
        ];
    }
}
