<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiemDanh extends Model
{
    use HasFactory;

    protected $table = 'diem_danh';

    public const PRESENT = 'PRESENT';

    public const LATE = 'LATE';

    public const ABSENT = 'ABSENT';

    public const EXCUSED = 'EXCUSED';

    protected $fillable = [
        'buoi_hoc_id',
        'dang_ky_hoc_phan_id',
        'trang_thai',
        'ghi_chu',
        'diem_danh_boi',
        'diem_danh_luc',
    ];

    protected function casts(): array
    {
        return [
            'diem_danh_luc' => 'datetime',
        ];
    }

    public function buoiHoc(): BelongsTo
    {
        return $this->belongsTo(BuoiHoc::class);
    }

    public function dangKyHocPhan(): BelongsTo
    {
        return $this->belongsTo(DangKyHocPhan::class);
    }

    public function nguoiDiemDanh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diem_danh_boi');
    }

    public function tinhLaCoMat(): bool
    {
        return in_array($this->trang_thai, [self::PRESENT, self::LATE], true);
    }

    public function scopeCuaDangKy(Builder $query, int $dangKyId): Builder
    {
        return $query->where('dang_ky_hoc_phan_id', $dangKyId);
    }
}
