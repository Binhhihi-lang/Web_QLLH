<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CauHinh extends Model
{
    use HasFactory;

    protected $table = 'cau_hinh';

    protected $fillable = [
        'khoa',
        'gia_tri',
        'mo_ta',
    ];

    protected function casts(): array
    {
        return [
            'gia_tri' => 'array',
        ];
    }

    public static function lay(string $khoa, mixed $macDinh = null): mixed
    {
        return static::query()->where('khoa', $khoa)->value('gia_tri') ?? $macDinh;
    }

    public static function dat(string $khoa, mixed $giaTri, ?string $moTa = null): self
    {
        return static::query()->updateOrCreate(
            ['khoa' => $khoa],
            ['gia_tri' => $giaTri, 'mo_ta' => $moTa],
        );
    }
}
