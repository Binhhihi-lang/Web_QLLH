<?php

namespace App\Policies;

use App\Models\LopHocPhan;
use App\Models\User;

/**
 * BR-03: TEACHER chỉ thao tác trên lớp học phần mình phụ trách.
 * BR-04: STUDENT chỉ xem dữ liệu lớp mình đã đăng ký.
 */
class LopHocPhanPolicy
{
    public function xemDanhSach(User $nguoiDung): bool
    {
        return true;
    }

    public function xem(User $nguoiDung, LopHocPhan $lop): bool
    {
        if ($nguoiDung->laAdmin()) {
            return true;
        }

        if ($nguoiDung->laGiangVien()) {
            return $this->laGiangVienCuaLop($nguoiDung, $lop);
        }

        // STUDENT thấy lớp đang mở, hoặc lớp mình đã đăng ký.
        if ($lop->trang_thai === LopHocPhan::OPEN) {
            return true;
        }

        return $this->daDangKy($nguoiDung, $lop);
    }

    public function tao(User $nguoiDung): bool
    {
        return $nguoiDung->laAdmin();
    }

    public function sua(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin();
    }

    public function xoa(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin();
    }

    /**
     * Chỉ TEACHER phụ trách lớp hoặc ADMIN được đổi trạng thái.
     */
    public function doiTrangThai(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin() || $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    private function laGiangVienCuaLop(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->giangVien !== null
            && $lop->giang_vien_id === $nguoiDung->giangVien->id;
    }

    private function daDangKy(User $nguoiDung, LopHocPhan $lop): bool
    {
        if ($nguoiDung->sinhVien === null) {
            return false;
        }

        return $lop->dangKyHocPhan()
            ->where('sinh_vien_id', $nguoiDung->sinhVien->id)
            ->where('trang_thai', 'ACTIVE')
            ->exists();
    }
}
