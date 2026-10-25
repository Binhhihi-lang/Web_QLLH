<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\NhatKy;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuanLyHoSoService
{
    /** @return array{0: SinhVien, 1: string} */
    public function taoSinhVien(array $duLieu): array
    {
        return DB::transaction(function () use ($duLieu) {
            $matKhau = Str::random(12);
            $trangThai = $duLieu['trang_thai'] ?? true;
            $nguoiDung = User::query()->create([
                'name' => $duLieu['ho_ten'],
                'email' => $duLieu['email'],
                'password' => $matKhau,
                'vai_tro' => User::SINH_VIEN,
                'trang_thai' => $trangThai,
                'must_change_password' => true,
            ]);

            $sinhVien = $nguoiDung->sinhVien()->create([
                ...$duLieu,
                'trang_thai' => $trangThai,
            ]);

            return [$sinhVien->load(['lopHanhChinh', 'user']), $matKhau];
        });
    }

    /** @return array{0: GiangVien, 1: string} */
    public function taoGiangVien(array $duLieu): array
    {
        return DB::transaction(function () use ($duLieu) {
            $matKhau = Str::random(12);
            $trangThai = $duLieu['trang_thai'] ?? true;
            $nguoiDung = User::query()->create([
                'name' => $duLieu['ho_ten'],
                'email' => $duLieu['email'],
                'password' => $matKhau,
                'vai_tro' => User::GIANG_VIEN,
                'trang_thai' => $trangThai,
                'must_change_password' => true,
            ]);

            $giangVien = $nguoiDung->giangVien()->create([
                ...$duLieu,
                'trang_thai' => $trangThai,
            ]);

            return [$giangVien->load('user'), $matKhau];
        });
    }

    public function capNhatSinhVien(SinhVien $sinhVien, array $duLieu): SinhVien
    {
        return DB::transaction(function () use ($sinhVien, $duLieu) {
            $trangThaiCu = $sinhVien->trang_thai;
            $sinhVien->update($duLieu);
            $sinhVien->user->update([
                'name' => $duLieu['ho_ten'],
                'email' => $duLieu['email'],
                'trang_thai' => $duLieu['trang_thai'] ?? $sinhVien->user->trang_thai,
            ]);

            if (array_key_exists('trang_thai', $duLieu) && $trangThaiCu !== $duLieu['trang_thai']) {
                $this->sauKhiDoiTrangThai($sinhVien, $trangThaiCu, $duLieu['trang_thai']);
            }

            return $sinhVien->fresh(['lopHanhChinh', 'user']);
        });
    }

    public function capNhatGiangVien(GiangVien $giangVien, array $duLieu): GiangVien
    {
        return DB::transaction(function () use ($giangVien, $duLieu) {
            $trangThaiCu = $giangVien->trang_thai;
            $giangVien->update($duLieu);
            $giangVien->user->update([
                'name' => $duLieu['ho_ten'],
                'email' => $duLieu['email'],
                'trang_thai' => $duLieu['trang_thai'] ?? $giangVien->user->trang_thai,
            ]);

            if (array_key_exists('trang_thai', $duLieu) && $trangThaiCu !== $duLieu['trang_thai']) {
                $this->sauKhiDoiTrangThai($giangVien, $trangThaiCu, $duLieu['trang_thai']);
            }

            return $giangVien->fresh('user');
        });
    }

    public function doiTrangThaiSinhVien(SinhVien $sinhVien, bool $trangThai): SinhVien
    {
        return DB::transaction(function () use ($sinhVien, $trangThai) {
            $cu = $sinhVien->trang_thai;
            $sinhVien->update(['trang_thai' => $trangThai]);
            $sinhVien->user->update(['trang_thai' => $trangThai]);
            $this->sauKhiDoiTrangThai($sinhVien, $cu, $trangThai);

            return $sinhVien->fresh(['lopHanhChinh', 'user']);
        });
    }

    public function doiTrangThaiGiangVien(GiangVien $giangVien, bool $trangThai): GiangVien
    {
        return DB::transaction(function () use ($giangVien, $trangThai) {
            $cu = $giangVien->trang_thai;
            $giangVien->update(['trang_thai' => $trangThai]);
            $giangVien->user->update(['trang_thai' => $trangThai]);
            $this->sauKhiDoiTrangThai($giangVien, $cu, $trangThai);

            return $giangVien->fresh('user');
        });
    }

    public function xoaSinhVien(SinhVien $sinhVien): void
    {
        $biChan = $sinhVien->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->whereHas('lopHocPhan.hocKy', fn ($query) => $query->where('trang_thai', '!=', HocKy::CLOSED))
            ->exists();

        if ($biChan) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Sinh viên còn đăng ký đang hoạt động ở học kỳ chưa đóng.');
        }

        DB::transaction(function () use ($sinhVien) {
            $this->xoaHoSoVaTaiKhoan($sinhVien, 'sinh_vien');
        });
    }

    public function xoaGiangVien(GiangVien $giangVien): void
    {
        $biChan = $giangVien->lopHocPhan()
            ->whereHas('hocKy', fn ($query) => $query->where('trang_thai', '!=', HocKy::CLOSED))
            ->exists();

        if ($biChan) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Giảng viên còn phụ trách lớp học phần thuộc học kỳ chưa đóng.');
        }

        DB::transaction(function () use ($giangVien) {
            $this->xoaHoSoVaTaiKhoan($giangVien, 'giang_vien');
        });
    }

    public function xoaLopHanhChinh(LopHanhChinh $lopHanhChinh): void
    {
        if ($lopHanhChinh->sinhVien()->exists()) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Lớp hành chính vẫn còn sinh viên.');
        }

        DB::transaction(function () use ($lopHanhChinh) {
            $lopHanhChinh->update(['deleted_by' => auth()->id()]);
            $lopHanhChinh->delete();
            NhatKy::ghi('lop_hanh_chinh', $lopHanhChinh->id, NhatKy::XOA);
        });
    }

    private function sauKhiDoiTrangThai(SinhVien|GiangVien $hoSo, bool $cu, bool $moi): void
    {
        if (! $moi) {
            $hoSo->user->tokens()->delete();
        }

        if ($cu !== $moi) {
            NhatKy::ghi(
                $hoSo instanceof SinhVien ? 'sinh_vien' : 'giang_vien',
                $hoSo->id,
                $moi ? NhatKy::MO_KHOA : NhatKy::KHOA,
                ['trang_thai' => $cu],
                ['trang_thai' => $moi],
            );
        }
    }

    private function xoaHoSoVaTaiKhoan(SinhVien|GiangVien $hoSo, string $loai): void
    {
        $nguoiDung = $hoSo->user;
        $nguoiDung->tokens()->delete();
        $hoSo->update(['deleted_by' => auth()->id()]);
        $nguoiDung->update(['deleted_by' => auth()->id()]);
        $hoSo->delete();
        $nguoiDung->delete();
        NhatKy::ghi($loai, $hoSo->id, NhatKy::XOA);
    }
}
