<?php

namespace App\Policies;

use App\Models\DangKyHocPhan;
use App\Models\LopHanhChinh;
use App\Models\User;

/**
 * BR-03: GIANG_VIEN chỉ thấy lớp hành chính có sinh viên mình đang dạy.
 * SINH_VIEN không đi qua đây — middleware `vai.tro` đã chặn ở `show`/`students`,
 * danh sách của chính mình đã lọc ngay trong query.
 * ADMIN không đi qua đây vì `Gate::before` đã cho qua (FR-01.04).
 */
class LopHanhChinhPolicy
{
    public function xem(User $nguoiDung, LopHanhChinh $lop): bool
    {
        return $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    public function xemSinhVien(User $nguoiDung, LopHanhChinh $lop): bool
    {
        return $this->xem($nguoiDung, $lop);
    }

    /**
     * Một truy vấn `exists()`: có sinh viên nào của lớp này đang đăng ký lớp học
     * phần mà giảng viên phụ trách không.
     */
    private function laGiangVienCuaLop(User $nguoiDung, LopHanhChinh $lop): bool
    {
        $giangVienId = $nguoiDung->giangVien?->id;
        if ($giangVienId === null) {
            return false;
        }

        return $lop->sinhVien()
            ->whereHas('dangKyHocPhan', fn ($dangKy) => $dangKy
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('lopHocPhan', fn ($lopHp) => $lopHp->where('giang_vien_id', $giangVienId)))
            ->exists();
    }
}
