<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'vai_tro', 'trang_thai'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    // Hai nhóm người dùng của hệ thống
    public const VAI_TRO = [
        'admin' => 'Quản trị viên',
        'giang_vien' => 'Giảng viên',
    ];

    public const ADMIN = 'admin';
    public const GIANG_VIEN = 'giang_vien';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'trang_thai' => 'boolean',
        ];
    }

    /**
     * Có phải quản trị viên không (được dùng toàn bộ chức năng).
     */
    public function laAdmin(): bool
    {
        return $this->vai_tro === self::ADMIN;
    }

    /**
     * Có phải giảng viên không (chỉ quản lý lớp học, sinh viên và tài khoản của mình).
     */
    public function laGiangVien(): bool
    {
        return $this->vai_tro === self::GIANG_VIEN;
    }

    /**
     * Tên vai trò để hiển thị.
     */
    public function tenVaiTro(): string
    {
        return self::VAI_TRO[$this->vai_tro] ?? $this->vai_tro;
    }
}
