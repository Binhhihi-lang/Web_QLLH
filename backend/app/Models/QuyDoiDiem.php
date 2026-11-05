<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuyDoiDiem extends Model
{
    protected $table = 'quy_doi_diem';

    public const QUY_TAC_LAM_TRON = 'HALF_UP_2';

    protected $fillable = [
        'hoc_ky_id',
        'trong_so',
        'bang_quy_doi',
        'so_ngay_sua_diem_danh',
        'quy_tac_lam_tron',
    ];

    protected function casts(): array
    {
        return [
            'hoc_ky_id' => 'integer',
            'so_ngay_sua_diem_danh' => 'integer',
            'trong_so' => 'array',
            'bang_quy_doi' => 'array',
        ];
    }

    public function hocKy(): BelongsTo
    {
        return $this->belongsTo(HocKy::class);
    }

    public function diem(): HasMany
    {
        return $this->hasMany(Diem::class, 'quy_doi_diem_id');
    }
}
