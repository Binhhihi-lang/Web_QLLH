<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Ngành — trực thuộc một khoa (ADR-020).
 *
 * `giang_vien.nganh_id` và `lop_hanh_chinh.nganh_id` cùng trỏ về bảng này; trước
 * đây hai nơi đó ghi ngành bằng hai từ vựng khác nhau (tên và mã) nên dữ liệu lệch.
 */
class Nganh extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nganh';

    protected $fillable = [
        'khoa_id',
        'ma_nganh',
        'ten_nganh',
        'mo_ta',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'khoa_id' => 'integer',
            'trang_thai' => 'boolean',
        ];
    }

    public function khoa(): BelongsTo
    {
        return $this->belongsTo(Khoa::class);
    }

    public function giangVien(): HasMany
    {
        return $this->hasMany(GiangVien::class);
    }

    public function lopHanhChinh(): HasMany
    {
        return $this->hasMany(LopHanhChinh::class);
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function scopeDangHoatDong(Builder $query): Builder
    {
        return $query->where('trang_thai', true);
    }
}
