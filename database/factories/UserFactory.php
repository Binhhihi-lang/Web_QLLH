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
            'vai_tro' => User::GIANG_VIEN,
            'trang_thai' => true,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Tài khoản quản trị viên.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => User::ADMIN,
        ]);
    }

    /**
     * Tài khoản giảng viên.
     */
    public function giangVien(): static
    {
        return $this->state(fn (array $attributes) => [
            'vai_tro' => User::GIANG_VIEN,
        ]);
    }

    /**
     * Tài khoản đang bị khóa.
     */
    public function biKhoa(): static
    {
        return $this->state(fn (array $attributes) => [
            'trang_thai' => false,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
