<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'vai_tro', 'trang_thai', 'must_change_password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // Ba nhóm người dùng của hệ thống
    public const VAI_TRO = [
        'ADMIN' => 'Quản trị viên',
        'GIANG_VIEN' => 'Giảng viên',
        'SINH_VIEN' => 'Sinh viên',
    ];

    public const ADMIN = 'ADMIN';

    public const GIANG_VIEN = 'GIANG_VIEN';

    public const SINH_VIEN = 'SINH_VIEN';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'trang_thai' => 'boolean',
            'must_change_password' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function sinhVien(): HasOne
    {
        return $this->hasOne(SinhVien::class);
    }

    public function giangVien(): HasOne
    {
        return $this->hasOne(GiangVien::class);
    }

    public function laAdmin(): bool
    {
        return $this->vai_tro === self::ADMIN;
    }

    public function laGiangVien(): bool
    {
        return $this->vai_tro === self::GIANG_VIEN;
    }

    public function laSinhVien(): bool
    {
        return $this->vai_tro === self::SINH_VIEN;
    }

    public function tenVaiTro(): string
    {
        return self::VAI_TRO[$this->vai_tro] ?? $this->vai_tro;
    }
}
