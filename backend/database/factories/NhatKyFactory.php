<?php

namespace Database\Factories;

use App\Models\NhatKy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NhatKy>
 */
class NhatKyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'doi_tuong_loai' => fake()->randomElement(['users', 'lop_hoc_phan', 'diem', 'buoi_hoc']),
            'doi_tuong_id' => fake()->numberBetween(1, 100),
            'hanh_dong' => fake()->randomElement([
                NhatKy::TAO,
                NhatKy::CAP_NHAT,
                NhatKy::XOA,
                NhatKy::KHOI_PHUC,
                NhatKy::DOI_TRANG_THAI,
                NhatKy::CHOT_DIEM,
            ]),
            'gia_tri_cu' => null,
            'gia_tri_moi' => null,
            'nguoi_thuc_hien_id' => User::factory()->admin(),
            'ghi_chu' => null,
            'thoi_diem' => now(),
        ];
    }
}
