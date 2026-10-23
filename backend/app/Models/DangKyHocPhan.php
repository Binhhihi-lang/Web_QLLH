<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DangKyHocPhan extends Model
{
    use HasFactory;

    protected $table = 'dang_ky_hoc_phan';

    public const ACTIVE = 'ACTIVE';

    public const CANCELLED = 'CANCELLED';

    protected $fillable = [
        'sinh_vien_id',
        'lop_hoc_phan_id',
        'trang_thai',
        'dang_ky_boi',
        'dang_ky_luc',
        'huy_boi',
        'huy_luc',
        'ly_do_huy',
    ];

    protected function casts(): array
    {
        return [
            'dang_ky_luc' => 'datetime',
            'huy_luc' => 'datetime',
        ];
    }

    public function sinhVien(): BelongsTo
    {
        return $this->belongsTo(SinhVien::class);
    }

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class);
    }

    public function diem(): HasOne
    {
        return $this->hasOne(Diem::class);
    }

    public function nguoiDangKy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dang_ky_boi');
    }

    public function nguoiHuy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'huy_boi');
    }

    public function scopeDangHieuLuc(Builder $query): Builder
    {
        return $query->where('trang_thai', self::ACTIVE);
    }
}
