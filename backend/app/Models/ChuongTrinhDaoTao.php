<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Chương trình đào tạo — một ngành × một khóa.
 *
 * Trường đổi chương trình cho khóa mới thì tạo bản mới, khóa cũ giữ nguyên
 * (sinh viên khóa cũ vẫn học theo chương trình của họ).
 */
class ChuongTrinhDaoTao extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'chuong_trinh_dao_tao';

    protected $fillable = [
        'ma_ctdt',
        'nganh_id',
        'khoa_hoc',
        'ten',
        'so_nam',
        'so_ky',
        'mo_ta',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'nganh_id' => 'integer',
            'so_nam' => 'float',
            'so_ky' => 'integer',
            'trang_thai' => 'boolean',
        ];
    }

    public function nganh(): BelongsTo
    {
        return $this->belongsTo(Nganh::class);
    }

    public function mon(): HasMany
    {
        return $this->hasMany(ChuongTrinhMon::class, 'chuong_trinh_id');
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function scopeDangApDung(Builder $query): Builder
    {
        return $query->where('trang_thai', true);
    }
}
