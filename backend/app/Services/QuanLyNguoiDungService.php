<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\NhatKy;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Quản lý tài khoản người dùng — SCR-50/SCR-51, FR-01.
 *
 * BR-30: khóa tài khoản phải thu hồi toàn bộ token, nếu không token Sanctum
 * còn hạn 7 ngày vẫn dùng được và việc khóa trở nên vô nghĩa.
 */
class QuanLyNguoiDungService
{
    /**
     * @param  array<string, mixed>  $duLieu
     * @return array{0: User, 1: string} Tài khoản và mật khẩu ban đầu (chỉ trả một lần)
     */
    public function tao(array $duLieu, int $nguoiThucHienId): array
    {
        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            $matKhau = Str::random(12);

            $nguoiDung = User::query()->create([
                'name' => $duLieu['name'],
                'email' => $duLieu['email'],
                'password' => $matKhau,
                'vai_tro' => $duLieu['vai_tro'],
                'trang_thai' => $duLieu['trang_thai'] ?? true,
                'must_change_password' => true,
            ]);

            NhatKy::ghi(
                'users',
                $nguoiDung->id,
                NhatKy::TAO,
                null,
                $this->duLieuGhiNhatKy($nguoiDung),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return [$nguoiDung->load(['sinhVien', 'giangVien']), $matKhau];
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function capNhat(User $nguoiDung, array $duLieu, int $nguoiThucHienId): User
    {
        return DB::transaction(function () use ($nguoiDung, $duLieu, $nguoiThucHienId) {
            $nguoiDung = User::query()->lockForUpdate()->findOrFail($nguoiDung->id);

            $truoc = $this->duLieuGhiNhatKy($nguoiDung);
            $trangThaiMoi = $duLieu['trang_thai'] ?? null;
            unset($duLieu['trang_thai']);

            $nguoiDung->update($duLieu);

            if ($trangThaiMoi !== null) {
                $this->apDungTrangThai($nguoiDung, (bool) $trangThaiMoi, $nguoiThucHienId);
            }

            NhatKy::ghi(
                'users',
                $nguoiDung->id,
                NhatKy::CAP_NHAT,
                $truoc,
                $this->duLieuGhiNhatKy($nguoiDung->fresh()),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $nguoiDung->fresh()->load(['sinhVien', 'giangVien']);
        });
    }

    /**
     * Xóa mềm tài khoản. Hợp đồng giới hạn ở tài khoản ADMIN: hồ sơ giảng viên
     * và sinh viên xóa ở màn của nhóm tương ứng .
     */
    public function xoa(User $nguoiDung, int $nguoiThucHienId): void
    {
        if ($nguoiDung->id === $nguoiThucHienId) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Không xóa được tài khoản của chính mình.');
        }

        if (! $nguoiDung->laAdmin()) {
            throw new LoiNghiepVu(
                'DELETE_BLOCKED',
                'Chỉ xóa được tài khoản quản trị. Tài khoản giảng viên/sinh viên xóa ở màn tương ứng.',
            );
        }

        DB::transaction(function () use ($nguoiDung, $nguoiThucHienId) {
            $nguoiDung = User::query()->lockForUpdate()->findOrFail($nguoiDung->id);

            $nguoiDung->tokens()->delete();
            $nguoiDung->deleted_by = $nguoiThucHienId;
            $nguoiDung->save();
            $nguoiDung->delete();

            NhatKy::ghi(
                'users',
                $nguoiDung->id,
                NhatKy::XOA,
                $this->duLieuGhiNhatKy($nguoiDung),
                null,
                nguoiThucHienId: $nguoiThucHienId,
            );
        });
    }

    public function doiTrangThai(User $nguoiDung, bool $trangThai, int $nguoiThucHienId): User
    {
        return DB::transaction(function () use ($nguoiDung, $trangThai, $nguoiThucHienId) {
            $nguoiDung = User::query()->lockForUpdate()->findOrFail($nguoiDung->id);
            $cu = $nguoiDung->trang_thai;

            $this->apDungTrangThai($nguoiDung, $trangThai, $nguoiThucHienId);

            if ($cu !== $trangThai) {
                NhatKy::ghi(
                    'users',
                    $nguoiDung->id,
                    $trangThai ? NhatKy::MO_KHOA : NhatKy::KHOA,
                    ['trang_thai' => $cu],
                    ['trang_thai' => $trangThai],
                    nguoiThucHienId: $nguoiThucHienId,
                );
            }

            return $nguoiDung->fresh()->load(['sinhVien', 'giangVien']);
        });
    }

    /**
     * Khóa/mở nhiều tài khoản — xử lý từng dòng độc lập (BR-31).
     *
     * @param  array<int, int>  $ids
     * @return list<array<string, mixed>>
     */
    public function doiTrangThaiHangLoat(array $ids, bool $trangThai, int $nguoiThucHienId): array
    {
        $ketQua = [];

        foreach ($ids as $id) {
            $nguoiDung = User::query()->find($id);

            if ($nguoiDung === null) {
                $ketQua[] = ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND'];

                continue;
            }

            if (! $trangThai && $nguoiDung->id === $nguoiThucHienId) {
                $ketQua[] = [
                    'id' => $id,
                    'ket_qua' => 'THAT_BAI',
                    'ma_loi' => 'FORBIDDEN',
                    'message' => 'Không khóa được tài khoản của chính mình.',
                ];

                continue;
            }

            $this->doiTrangThai($nguoiDung, $trangThai, $nguoiThucHienId);
            $ketQua[] = ['id' => $id, 'ket_qua' => 'THANH_CONG'];
        }

        return $ketQua;
    }

    /**
     * Cấp lại mật khẩu: trả về một lần, buộc đổi ở lần đăng nhập kế tiếp,
     * và thu hồi token cũ để mật khẩu mới là đường vào duy nhất.
     *
     * @return array{0: User, 1: string}
     */
    public function datLaiMatKhau(User $nguoiDung, int $nguoiThucHienId): array
    {
        return DB::transaction(function () use ($nguoiDung, $nguoiThucHienId) {
            $nguoiDung = User::query()->lockForUpdate()->findOrFail($nguoiDung->id);
            $matKhau = Str::random(12);

            $nguoiDung->update([
                'password' => $matKhau,
                'must_change_password' => true,
            ]);
            $nguoiDung->tokens()->delete();

            NhatKy::ghi(
                'users',
                $nguoiDung->id,
                NhatKy::CAP_NHAT,
                null,
                ['dat_lai_mat_khau' => true],
                ghiChu: 'Đặt lại mật khẩu',
                nguoiThucHienId: $nguoiThucHienId,
            );

            return [$nguoiDung->fresh()->load(['sinhVien', 'giangVien']), $matKhau];
        });
    }

    /**
     * BR-30 — khóa thì thu hồi token ngay; mở khóa thì không cần làm gì thêm.
     */
    private function apDungTrangThai(User $nguoiDung, bool $trangThai, int $nguoiThucHienId): void
    {
        if (! $trangThai && $nguoiDung->id === $nguoiThucHienId) {
            throw new LoiNghiepVu('FORBIDDEN', 'Không khóa được tài khoản của chính mình.', 403);
        }

        $nguoiDung->trang_thai = $trangThai;
        $nguoiDung->save();

        if (! $trangThai) {
            $nguoiDung->tokens()->delete();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function duLieuGhiNhatKy(User $nguoiDung): array
    {
        return $nguoiDung->only(['name', 'email', 'vai_tro', 'trang_thai']);
    }
}
