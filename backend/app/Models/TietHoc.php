<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Khung tiết của trường — dữ liệu cấu hình, không phụ thuộc năm học.
 *
 * Ca (SANG/CHIEU/TOI) là thuộc tính của tiết: một buổi học vắt qua hai ca
 * (ví dụ tiết 5–7) vẫn hợp lệ, nên buổi học không lưu cột `ca`.
 */
class TietHoc extends Model
{
    use HasFactory;

    public const SANG = 'SANG';

    public const CHIEU = 'CHIEU';

    public const TOI = 'TOI';

    protected $table = 'tiet_hoc';

    protected $fillable = [
        'so_tiet',
        'ca',
        'gio_bat_dau',
        'gio_ket_thuc',
    ];

    protected function casts(): array
    {
        return [
            'so_tiet' => 'integer',
        ];
    }
}
