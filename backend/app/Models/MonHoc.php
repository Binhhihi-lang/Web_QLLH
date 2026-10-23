<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MonHoc extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'mon_hoc';

    protected $fillable = [
        'ma_mon',
        'ten_mon',
        'so_tin_chi',
        'mo_ta',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'so_tin_chi' => 'integer',
            'trang_thai' => 'boolean',
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

    public function scopeDangHoatDong(Builder $query): Builder
    {
        return $query->where('trang_thai', true);
    }
}
