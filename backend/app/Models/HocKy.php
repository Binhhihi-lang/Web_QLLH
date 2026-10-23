<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HocKy extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'hoc_ky';

    public const UPCOMING = 'UPCOMING';

    public const ONGOING = 'ONGOING';

    public const CLOSED = 'CLOSED';

    protected $fillable = [
        'ma_hoc_ky',
        'ten_hoc_ky',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'mo_dang_ky_luc',
        'dong_dang_ky_luc',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'ngay_bat_dau' => 'date',
            'ngay_ket_thuc' => 'date',
            'mo_dang_ky_luc' => 'datetime',
            'dong_dang_ky_luc' => 'datetime',
        ];
    }

    public function lopHocPhan(): HasMany
    {
        return $this->hasMany(LopHocPhan::class);
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function dangMoDangKy(): bool
    {
        $bayGio = now();

        return $this->trang_thai !== self::CLOSED
            && $bayGio->between($this->mo_dang_ky_luc, $this->dong_dang_ky_luc);
    }

    public function scopeDangMoDangKy(Builder $query): Builder
    {
        return $query
            ->where('trang_thai', '!=', self::CLOSED)
            ->where('mo_dang_ky_luc', '<=', now())
            ->where('dong_dang_ky_luc', '>=', now());
    }
}
