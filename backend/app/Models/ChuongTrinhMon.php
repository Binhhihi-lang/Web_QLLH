<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Một môn trong chương trình đào tạo, kèm kỳ thứ và loại bắt buộc/tự chọn.
 *
 * `ky_thu = null` nghĩa là chưa gán kỳ — sinh viên không thấy môn này khi
 * đăng ký cho tới khi ADMIN gán (màn chi tiết CTĐT cảnh báo số môn chưa gán).
 */
class ChuongTrinhMon extends Model
{
    use HasFactory;

    protected $table = 'chuong_trinh_mon';

    protected $fillable = [
        'chuong_trinh_id',
        'mon_hoc_id',
        'ky_thu',
        'bat_buoc',
    ];

    protected function casts(): array
    {
        return [
            'chuong_trinh_id' => 'integer',
            'mon_hoc_id' => 'integer',
            'ky_thu' => 'integer',
            'bat_buoc' => 'boolean',
        ];
    }

    public function chuongTrinh(): BelongsTo
    {
        return $this->belongsTo(ChuongTrinhDaoTao::class, 'chuong_trinh_id');
    }

    public function monHoc(): BelongsTo
    {
        return $this->belongsTo(MonHoc::class);
    }
}
