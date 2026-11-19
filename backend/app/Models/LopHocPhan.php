<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LopHocPhan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lop_hoc_phan';

    public const OPEN = 'OPEN';

    public const CLOSED = 'CLOSED';

    public const CANCELLED = 'CANCELLED';

    protected $fillable = [
        'ma_lop_hp',
        'mon_hoc_id',
        'hoc_ky_id',
        'giang_vien_id',
        'si_so_toi_da',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'si_so_toi_da' => 'integer',
            'chot_diem_luc' => 'datetime',
        ];
    }

    public function monHoc(): BelongsTo
    {
        return $this->belongsTo(MonHoc::class);
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class);
    }

    public function giangVien(): BelongsTo
    {
        return $this->belongsTo(GiangVien::class);
    }

    public function buoiHoc(): HasMany
    {
        return $this->hasMany(BuoiHoc::class);
    }

    public function dangKyHocPhan(): HasMany
    {
        return $this->hasMany(DangKyHocPhan::class);
    }

    public function chotDiemBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'chot_diem_boi');
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function daChotDiem(): bool
    {
        return $this->chot_diem_luc !== null;
    }

    /**
     * Sĩ số hiện tại = số đăng ký ACTIVE. Không lưu cột để tránh lệch dữ liệu.
     */
    public function siSoHienTai(): int
    {
        return $this->dangKyHocPhan()->where('trang_thai', 'ACTIVE')->count();
    }

    public function conCho(): int
    {
        return max(0, $this->si_so_toi_da - $this->siSoHienTai());
    }

    public function scopeDangMo(Builder $query): Builder
    {
        return $query->where('trang_thai', self::OPEN);
    }
}
