<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SinhVien extends Model
{
    use HasFactory;

    protected $table = 'sinh_viens';

    protected $fillable = [
        'ma_sv',
        'ho_ten',
        'email',
        'ngay_sinh',
        'gioi_tinh',
        'lop_hoc_id',
        'so_dien_thoai',
        'dia_chi',
        'trang_thai',
    ];

    protected function casts(): array
    {
        return [
            'ngay_sinh' => 'date',
            'gioi_tinh' => 'boolean',
            'trang_thai' => 'boolean',
        ];
    }

    /**
     * Sinh viên thuộc về 1 lớp học
     */
    public function lopHoc()
    {
        return $this->belongsTo(LopHoc::class, 'lop_hoc_id');
    }
}
