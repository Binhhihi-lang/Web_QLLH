<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'vai_tro' => User::SINH_VIEN,
            'trang_thai' => true,
            'must_change_password' => false,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => User::ADMIN,
        ]);
    }

    public function giangVien(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => User::GIANG_VIEN,
        ]);
    }

    public function sinhVien(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => User::SINH_VIEN,
        ]);
    }

    public function biKhoa(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => false,
        ]);
    }

    public function phaiDoiMatKhau(): static
    {
        return $this->state(fn (array $attributes) => [
            'must_change_password' => true,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function daXoa(): static
    {
        return $this->state(fn (array $attributes) => [
            'deleted_at' => now(),
        ]);
    }
}
