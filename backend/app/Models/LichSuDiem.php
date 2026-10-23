<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LichSuDiem extends Model
{
    use HasFactory;

    protected $table = 'lich_su_diem';

    protected $fillable = [
        'diem_id',
        'truong',
        'gia_tri_cu',
        'gia_tri_moi',
        'nguoi_sua_id',
        'ly_do',
        'thoi_diem',
    ];

    protected function casts(): array
    {
        return [
            'thoi_diem' => 'datetime',
        ];
    }

    public function diem(): BelongsTo
    {
        return $this->belongsTo(Diem::class);
    }

    public function nguoiSua(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_sua_id');
    }
}
