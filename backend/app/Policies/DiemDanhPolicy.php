<?php

namespace App\Policies;

use App\Models\BuoiHoc;
use App\Models\User;

/**
 * BR-03: TEACHER chỉ điểm danh lớp mình phụ trách.
 * BR-14: học kỳ CLOSED chỉ đọc.
 */
class DiemDanhPolicy
{
    public function diemDanh(User $nguoiDung, BuoiHoc $buoiHoc): bool
    {
        $lop = $buoiHoc->lopHocPhan;

        if ($lop->hocKy?->trang_thai === 'CLOSED') {
            return false;
        }

        if ($nguoiDung->laAdmin()) {
            return true;
        }

        return $nguoiDung->giangVien !== null
            && $lop->giang_vien_id === $nguoiDung->giangVien->id;
    }

    public function xem(User $nguoiDung, BuoiHoc $buoiHoc): bool
    {
        if ($nguoiDung->laAdmin()) {
            return true;
        }

        $lop = $buoiHoc->lopHocPhan;

        if ($nguoiDung->laGiangVien()) {
            return $nguoiDung->giangVien?->id === $lop->giang_vien_id;
        }

        // STUDENT xem điểm danh của lớp mình đã đăng ký.
        return $lop->dangKyHocPhan()
            ->where('sinh_vien_id', $nguoiDung->sinhVien?->id)
            ->where('trang_thai', 'ACTIVE')
            ->exists();
    }
}
