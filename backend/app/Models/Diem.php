<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Diem extends Model
{
    use HasFactory;

    protected $table = 'diem';

    public const DAT = 'DAT';

    public const KHONG_DAT = 'KHONG_DAT';

    protected $fillable = [
        'dang_ky_hoc_phan_id',
        'diem_chuyen_can',
        'diem_giua_ky',
        'diem_cuoi_ky',
        'diem_tong_ket',
        'diem_chu',
        'diem_he_4',
        'ket_qua',
    ];

    protected function casts(): array
    {
        return [
            'diem_chuyen_can' => 'decimal:2',
            'diem_giua_ky' => 'decimal:2',
            'diem_cuoi_ky' => 'decimal:2',
            'diem_tong_ket' => 'decimal:2',
            'diem_he_4' => 'decimal:2',
        ];
    }

    public function dangKyHocPhan(): BelongsTo
    {
        return $this->belongsTo(DangKyHocPhan::class);
    }

    public function lichSuDiem(): HasMany
    {
        return $this->hasMany(LichSuDiem::class);
    }

    public function duDiemThanhPhan(): bool
    {
        return $this->diem_chuyen_can !== null
            && $this->diem_giua_ky !== null
            && $this->diem_cuoi_ky !== null;
    }

    public function scopeDaCoTongKet(Builder $query): Builder
    {
        return $query->whereNotNull('diem_tong_ket');
    }
}
