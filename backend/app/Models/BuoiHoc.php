<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BuoiHoc extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'buoi_hoc';

    public const SCHEDULED = 'SCHEDULED';

    public const DONE = 'DONE';

    public const CANCELLED = 'CANCELLED';

    protected $fillable = [
        'lop_hoc_phan_id',
        'ngay_hoc',
        'gio_bat_dau',
        'gio_ket_thuc',
        'phong_hoc_id',
        'trang_thai',
        'ly_do_huy',
    ];

    protected function casts(): array
    {
        return [
            'ngay_hoc' => 'date',
        ];
    }

    public function lopHocPhan(): BelongsTo
    {
        return $this->belongsTo(LopHocPhan::class);
    }

    public function phongHoc(): BelongsTo
    {
        return $this->belongsTo(PhongHoc::class);
    }

    public function diemDanh(): HasMany
    {
        return $this->hasMany(DiemDanh::class);
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function daDienRa(): bool
    {
        return $this->ngay_hoc->copy()->setTimeFromTimeString($this->gio_ket_thuc)->lt(now());
    }

    public function scopeSapDienRa(Builder $query): Builder
    {
        return $query
            ->where('trang_thai', self::SCHEDULED)
            ->whereRaw('TIMESTAMP(ngay_hoc, gio_ket_thuc) > ?', [now()]);
    }
}
