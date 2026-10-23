<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GiangVien extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'giang_vien';

    protected $fillable = [
        'ma_gv',
        'ho_ten',
        'email',
        'so_dien_thoai',
        'chuyen_mon',
        'user_id',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'trang_thai' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
