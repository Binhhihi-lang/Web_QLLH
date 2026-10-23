<?php

namespace App\Policies;

use App\Models\Diem;
use App\Models\User;

/**
 * BR-03: TEACHER chỉ nhập điểm cho lớp mình phụ trách.
 * BR-13: điểm đã chốt bị khóa, chỉ ADMIN mở khóa kèm lý do.
 * BR-04: STUDENT chỉ xem điểm của chính mình.
 */
class DiemPolicy
{
    public function xem(User $nguoiDung, Diem $diem): bool
    {
        if ($nguoiDung->laAdmin()) {
            return true;
        }

        $dangKy = $diem->dangKyHocPhan;

        if ($nguoiDung->laSinhVien()) {
            return $nguoiDung->sinhVien?->id === $dangKy->sinh_vien_id;
        }

        return $this->laGiangVienCuaLop($nguoiDung, $dangKy->lopHocPhan);
    }

    public function nhap(User $nguoiDung, Diem $diem): bool
    {
        if ($diem->dangKyHocPhan->lopHocPhan->daChotDiem()) {
            return false;
        }

        if ($nguoiDung->laAdmin()) {
            return true;
        }

        return $this->laGiangVienCuaLop($nguoiDung, $diem->dangKyHocPhan->lopHocPhan);
    }

    public function moKhoa(User $nguoiDung, Diem $diem): bool
    {
        return $nguoiDung->laAdmin();
    }

    private function laGiangVienCuaLop(User $nguoiDung, $lop): bool
    {
        return $nguoiDung->giangVien !== null
            && $lop->giang_vien_id === $nguoiDung->giangVien->id;
    }
}
