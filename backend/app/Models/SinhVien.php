<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SinhVien extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sinh_vien';

    protected $fillable = [
        'ma_sv',
        'ho_ten',
        'ngay_sinh',
        'gioi_tinh',
        'email',
        'so_dien_thoai',
        'dia_chi',
        'lop_hanh_chinh_id',
        'user_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lopHanhChinh(): BelongsTo
    {
        return $this->belongsTo(LopHanhChinh::class);
    }

    public function dangKyHocPhan(): HasMany
    {
        return $this->hasMany(DangKyHocPhan::class);
    }

    public function xoaBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function khoiPhucBoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function scopeDangHoatDong(Builder $query): Builder
    {
        return $query->where('trang_thai', true);
    }

    /**
     * Năm thứ hiện tại của sinh viên (03-data-model.md §5.6, BR-23).
     *
     * `nam_thu = nam_bat_dau(nam_hoc) - nam_nhap_hoc + 1`
     *
     * Trả null khi không đủ dữ liệu để kết luận (chưa xếp lớp hành chính,
     * lớp chưa có `nam_nhap_hoc`, hoặc học kỳ chưa có `nam_hoc`) — khi đó
     * BR-23 KHÔNG chặn, vì chặn trên dữ liệu thiếu sẽ khóa nhầm sinh viên.
     */
    public function namThuTrong(HocKy $hocKy): ?int
    {
        $namBatDau = $hocKy->namBatDauNamHoc();
        $namNhapHoc = $this->lopHanhChinh?->nam_nhap_hoc;

        if ($namBatDau === null || $namNhapHoc === null) {
            return null;
        }

        return $namBatDau - (int) $namNhapHoc + 1;
    }
}
