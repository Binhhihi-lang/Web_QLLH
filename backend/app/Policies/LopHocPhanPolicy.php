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
     *
     * Lưu ý: route `PATCH /api/sections/{id}/status` hiện chỉ mở cho ADMIN theo
     * hợp đồng (docs/04 §10), nên nhánh TEACHER dưới đây chưa có đường vào.
     * Giữ lại để khi hợp đồng mở cho TEACHER thì không phải viết lại quyền.
     */
    public function doiTrangThai(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin() || $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    /**
     * ADMIN, TEACHER phụ trách lớp, hoặc SINH VIÊN đã đăng ký ACTIVE vào lớp
     * được xem danh sách sinh viên của lớp.
     *
     * Sinh viên chỉ thấy roster rút gọn (mã + tên) — lọc ở controller, không
     * nới quyền xem bảng điểm (`xemDiem` bên dưới vẫn chỉ ADMIN/TEACHER).
     */
    public function xemSinhVien(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin()
            || $this->laGiangVienCuaLop($nguoiDung, $lop)
            || $this->daDangKy($nguoiDung, $lop);
    }

    public function xemDiem(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin() || $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    /**
     * Lịch của lớp: ADMIN, giảng viên phụ trách, và sinh viên đã đăng ký ACTIVE.
     * Sinh viên chưa đăng ký không xem được lịch của lớp (FR-10.03).
     */
    public function xemBuoiHoc(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin()
            || $this->laGiangVienCuaLop($nguoiDung, $lop)
            || $this->daDangKy($nguoiDung, $lop);
    }

    /** Sinh lịch, sửa, hủy, xóa buổi — ADMIN hoặc giảng viên phụ trách lớp. */
    public function quanLyBuoiHoc(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin() || $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    public function nhapDiem(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    /**
     * BR-03: chỉ TEACHER phụ trách lớp được chốt điểm — ADMIN không chốt hộ
     * (docs/06-test-plan.md §5: `POST /api/sections/{id}/finalize` → ADMIN 403).
     */
    public function chotDiem(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $this->laGiangVienCuaLop($nguoiDung, $lop);
    }

    public function moKhoaDiem(User $nguoiDung, LopHocPhan $lop): bool
    {
        return $nguoiDung->laAdmin();
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
