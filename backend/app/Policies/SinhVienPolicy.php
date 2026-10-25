<?php

namespace App\Policies;

use App\Models\DangKyHocPhan;
use App\Models\SinhVien;
use App\Models\User;

/**
 * FR-02: ADMIN quản lý toàn bộ; TEACHER xem sinh viên thuộc lớp mình phụ trách;
 * STUDENT chỉ xem hồ sơ của chính mình (BR-04).
 */
class SinhVienPolicy
{
    public function xemDanhSach(User $nguoiDung): bool
    {
        return $nguoiDung->laAdmin() || $nguoiDung->laGiangVien();
    }

    public function xem(User $nguoiDung, SinhVien $sinhVien): bool
    {
        if ($nguoiDung->laAdmin()) {
            return true;
        }

        if ($nguoiDung->laSinhVien()) {
            return $nguoiDung->sinhVien?->id === $sinhVien->id;
        }

        return $this->thuocLopCuaGiangVien($nguoiDung, $sinhVien);
    }

    public function tao(User $nguoiDung): bool
    {
        return $nguoiDung->laAdmin();
    }

    public function sua(User $nguoiDung, SinhVien $sinhVien): bool
    {
        if ($nguoiDung->laAdmin()) {
            return true;
        }

        // STUDENT tự sửa hồ sơ: chỉ so_dien_thoai, dia_chi (FR-01.06).
        return $nguoiDung->laSinhVien() && $nguoiDung->sinhVien?->id === $sinhVien->id;
    }

    public function xoa(User $nguoiDung, SinhVien $sinhVien): bool
    {
        return $nguoiDung->laAdmin();
    }

    private function thuocLopCuaGiangVien(User $nguoiDung, SinhVien $sinhVien): bool
    {
        if ($nguoiDung->giangVien === null) {
            return false;
        }

        return $sinhVien->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->whereHas('lopHocPhan', fn ($q) => $q->where('giang_vien_id', $nguoiDung->giangVien->id))
            ->exists();
    }
}
