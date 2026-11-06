<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NhatKy extends Model
{
    use HasFactory;

    protected $table = 'nhat_ky';

    public const TAO = 'TAO';

    public const CAP_NHAT = 'CAP_NHAT';

    public const XOA = 'XOA';

    public const KHOI_PHUC = 'KHOI_PHUC';

    public const KHOA = 'KHOA';

    public const MO_KHOA = 'MO_KHOA';

    public const DOI_TRANG_THAI = 'DOI_TRANG_THAI';

    public const CHOT_DIEM = 'CHOT_DIEM';

    public const HANH_DONG = [
        self::TAO => 'Tạo mới',
        self::CAP_NHAT => 'Cập nhật',
        self::XOA => 'Xóa',
        self::KHOI_PHUC => 'Khôi phục',
        self::KHOA => 'Khóa',
        self::MO_KHOA => 'Mở khóa',
        self::DOI_TRANG_THAI => 'Đổi trạng thái',
        self::CHOT_DIEM => 'Chốt điểm',
    ];

    public const DOI_TUONG = [
        'users' => 'Người dùng',
        'sinh_vien' => 'Sinh viên',
        'giang_vien' => 'Giảng viên',
        'lop_hanh_chinh' => 'Lớp hành chính',
        'lop_hoc_phan' => 'Lớp học phần',
        'hoc_ky' => 'Học kỳ',
        'buoi_hoc' => 'Buổi học',
        'dang_ky_hoc_phan' => 'Đăng ký học phần',
        'khoa' => 'Khoa',
        'nganh' => 'Ngành',
        'mon_hoc' => 'Môn học',
        'phong_hoc' => 'Phòng học',
        'menu' => 'Menu',
        'cau_hinh' => 'Cấu hình',
    ];

    protected $fillable = [
        'doi_tuong_loai',
        'doi_tuong_id',
        'hanh_dong',
        'gia_tri_cu',
        'gia_tri_moi',
        'nguoi_thuc_hien_id',
        'ghi_chu',
        'thoi_diem',
    ];

    protected function casts(): array
    {
        return [
            'gia_tri_cu' => 'array',
            'gia_tri_moi' => 'array',
            'thoi_diem' => 'datetime',
        ];
    }

    public function nguoiThucHien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_thuc_hien_id');
    }

    public function tenHanhDong(): string
    {
        return self::HANH_DONG[$this->hanh_dong] ?? $this->hanh_dong;
    }

    public function tenDoiTuongLoai(): string
    {
        return self::DOI_TUONG[$this->doi_tuong_loai] ?? $this->doi_tuong_loai;
    }

    public static function ghi(
        string $doiTuongLoai,
        int $doiTuongId,
        string $hanhDong,
        ?array $giaTriCu = null,
        ?array $giaTriMoi = null,
        ?string $ghiChu = null,
        ?int $nguoiThucHienId = null,
    ): self {
        return static::query()->create([
            'doi_tuong_loai' => $doiTuongLoai,
            'doi_tuong_id' => $doiTuongId,
            'hanh_dong' => $hanhDong,
            'gia_tri_cu' => $giaTriCu,
            'gia_tri_moi' => $giaTriMoi,
            'nguoi_thuc_hien_id' => $nguoiThucHienId ?? auth()->id(),
            'ghi_chu' => $ghiChu,
            'thoi_diem' => now(),
        ]);
    }
}
