<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Ca thi của một môn trong một học kỳ. Dùng chung khung tiết với buổi học,
 * không có trạng thái và không có hình thức thi.
 */
class LichThi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lich_thi';

    protected $fillable = [
        'hoc_ky_id',
        'mon_hoc_id',
        'ngay_thi',
        'tiet_bat_dau',
        'tiet_ket_thuc',
        'gio_bat_dau',
        'gio_ket_thuc',
        'phong_hoc_id',
        'dot_thi',
        'ghi_chu',
    ];

    protected function casts(): array
    {
        return [
            'ngay_thi' => 'date',
            'tiet_bat_dau' => 'integer',
            'tiet_ket_thuc' => 'integer',
        ];
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class);
    }

    public function monHoc(): BelongsTo
    {
        return $this->belongsTo(MonHoc::class);
    }

    public function phongHoc(): BelongsTo
    {
        return $this->belongsTo(PhongHoc::class);
    }

    public function scopeCuaHocKy(Builder $query, int $hocKyId): Builder
    {
        return $query->where('hoc_ky_id', $hocKyId);
    }
}
