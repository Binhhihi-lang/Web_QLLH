<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LopHanhChinh extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lop_hanh_chinh';

    protected $fillable = [
        'ma_lop',
        'ten_lop',
        'khoa',
        'mo_ta',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'trang_thai' => 'boolean',
        ];
    }

    public function sinhVien(): HasMany
    {
        return $this->hasMany(SinhVien::class);
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
