<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Khoa — đơn vị quản lý cấp trên của ngành và của môn học (ADR-020).
 */
class Khoa extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'khoa';

    protected $fillable = [
        'ma_khoa',
        'ten_khoa',
        'mo_ta',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'trang_thai' => 'boolean',
        ];
    }

    public function nganh(): HasMany
    {
        return $this->hasMany(Nganh::class);
    }

    public function monHoc(): HasMany
    {
        return $this->hasMany(MonHoc::class);
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
