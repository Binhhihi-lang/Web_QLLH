<?php

namespace Database\Factories;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ten' => 'Mục '.fake()->unique()->word(),
            'url' => '/'.fake()->unique()->slug(2),
            'vi_tri' => fake()->randomElement(array_keys(Menu::VI_TRI)),
            'nhom' => fake()->optional()->randomElement(['Học vụ', 'Hệ thống', 'Tổng quan']),
            'vai_tro' => null,
            'thu_tu' => fake()->numberBetween(1, 20),
            'trang_thai' => true,
        ];
    }

    /**
     * Menu chỉ hiển thị với quản trị viên.
     */
    public function chiAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => [User::ADMIN],
        ]);
    }

    /**
     * Menu đã bị ẩn.
     */
    public function daAn(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => false,
        ]);
    }
}
