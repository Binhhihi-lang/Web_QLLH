<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PhongHoc extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'phong_hoc';

    protected $fillable = [
        'ma_phong',
        'ten_phong',
        'suc_chua',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'suc_chua' => 'integer',
            'trang_thai' => 'boolean',
        ];
    }

    public function buoiHoc(): HasMany
    {
        return $this->hasMany(BuoiHoc::class);
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
