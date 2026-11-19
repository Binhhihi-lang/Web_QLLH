<?php

namespace Database\Factories;

use App\Models\ChuongTrinhDaoTao;
use App\Models\Nganh;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChuongTrinhDaoTao>
 */
class ChuongTrinhDaoTaoFactory extends Factory
{
    protected $model = ChuongTrinhDaoTao::class;

    public function definition(): array
    {
        return [
            'ma_ctdt' => 'CT-'.strtoupper(fake()->unique()->bothify('?###??')),
            'nganh_id' => Nganh::factory(),
            // Cùng từ vựng với `lop_hanh_chinh.khoa_hoc`.
            'khoa_hoc' => 'K'.fake()->numberBetween(60, 69),
            'ten' => 'Chương trình '.fake()->unique()->words(3, true),
            'mo_ta' => null,
            'trang_thai' => true,
        ];
    }

    public function thuocNganh(Nganh $nganh): static
    {
        return $this->state(fn (array $attributes) => [
            'nganh_id' => $nganh->id,
        ]);
    }
}
