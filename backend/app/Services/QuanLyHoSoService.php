<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
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

    public function doiTrangThaiSinhVienHangLoat(array $ids, bool $trangThai): array
    {
        return $this->doiTrangThaiHoSoHangLoat(SinhVien::class, 'sinh_vien', $ids, $trangThai);
    }

    public function doiTrangThaiGiangVienHangLoat(array $ids, bool $trangThai): array
    {
        return $this->doiTrangThaiHoSoHangLoat(GiangVien::class, 'giang_vien', $ids, $trangThai);
    }

    public function xoaSinhVienHangLoat(array $ids): array
    {
        return $this->xoaHoSoHangLoat(SinhVien::class, 'sinh_vien', $ids);
    }

    public function xoaGiangVienHangLoat(array $ids): array
    {
        return $this->xoaHoSoHangLoat(GiangVien::class, 'giang_vien', $ids);
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

    /**
     * @param  class-string<SinhVien|GiangVien>  $modelClass
     * @return list<array{id: int, ket_qua: string, ma_loi?: string, message?: string}>
     */
    private function doiTrangThaiHoSoHangLoat(string $modelClass, string $loai, array $ids, bool $trangThai): array
    {
        return DB::transaction(function () use ($modelClass, $loai, $ids, $trangThai) {
            $hoSoMau = new $modelClass;
            $hoSos = $modelClass::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get(['id', 'user_id', 'trang_thai'])
                ->keyBy('id');
            $ketQua = [];
            $hoSoIds = [];
            $nguoiDungIds = [];
            $nhatKys = [];
            $thoiDiem = now();

            foreach ($ids as $id) {
                $hoSo = $hoSos->get($id);
                if ($hoSo === null) {
                    $tenDoiTuong = $loai === 'sinh_vien' ? 'sinh viên' : 'giảng viên';
                    $ketQua[] = [
                        'id' => $id,
                        'ket_qua' => 'THAT_BAI',
                        'ma_loi' => 'NOT_FOUND',
                        'message' => "Không tìm thấy {$tenDoiTuong}.",
                    ];

                    continue;
                }

                $hoSoIds[] = $hoSo->id;
                $nguoiDungIds[] = $hoSo->user_id;
                $ketQua[] = ['id' => $id, 'ket_qua' => 'THANH_CONG'];

                if ((bool) $hoSo->trang_thai !== $trangThai) {
                    $nhatKys[] = [
                        'doi_tuong_loai' => $loai,
                        'doi_tuong_id' => $hoSo->id,
                        'hanh_dong' => $trangThai ? NhatKy::MO_KHOA : NhatKy::KHOA,
                        'gia_tri_cu' => json_encode(['trang_thai' => (bool) $hoSo->trang_thai], JSON_THROW_ON_ERROR),
                        'gia_tri_moi' => json_encode(['trang_thai' => $trangThai], JSON_THROW_ON_ERROR),
                        'nguoi_thuc_hien_id' => auth()->id(),
                        'ghi_chu' => null,
                        'thoi_diem' => $thoiDiem,
                        'created_at' => $thoiDiem,
                        'updated_at' => $thoiDiem,
                    ];
                }
            }

            if ($hoSoIds === []) {
                return $ketQua;
            }

            DB::table($hoSoMau->getTable())->whereIn('id', $hoSoIds)->update([
                'trang_thai' => $trangThai,
                'updated_at' => $thoiDiem,
            ]);
            DB::table('users')->whereIn('id', $nguoiDungIds)->update([
                'trang_thai' => $trangThai,
                'updated_at' => $thoiDiem,
            ]);

            if (! $trangThai) {
                $nguoiDung = new User;
                $tokenRelation = $nguoiDung->tokens();
                DB::table($tokenRelation->getRelated()->getTable())
                    ->where('tokenable_type', $nguoiDung->getMorphClass())
                    ->whereIn('tokenable_id', $nguoiDungIds)
                    ->delete();
            }

            if ($nhatKys !== []) {
                DB::table('nhat_ky')->insert($nhatKys);
            }

            return $ketQua;
        });
    }

    /**
     * @param  class-string<SinhVien|GiangVien>  $modelClass
     * @return list<array{id: int, ket_qua: string, ma_loi?: string, message?: string}>
     */
    private function xoaHoSoHangLoat(string $modelClass, string $loai, array $ids): array
    {
        return DB::transaction(function () use ($modelClass, $loai, $ids) {
            $hoSoMau = new $modelClass;
            $hoSos = $modelClass::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get(['id', 'user_id'])
                ->keyBy('id');

            if ($modelClass === SinhVien::class) {
                $biChanIds = DangKyHocPhan::query()
                    ->whereIn('sinh_vien_id', $hoSos->keys())
                    ->where('trang_thai', DangKyHocPhan::ACTIVE)
                    ->whereHas('lopHocPhan.hocKy', fn ($query) => $query->where('trang_thai', '!=', HocKy::CLOSED))
                    ->pluck('sinh_vien_id')
                    ->all();
                $tenDoiTuong = 'sinh viên';
                $thongBaoBiChan = 'Sinh viên còn đăng ký đang hoạt động ở học kỳ chưa đóng.';
            } else {
                $biChanIds = LopHocPhan::query()
                    ->whereIn('giang_vien_id', $hoSos->keys())
                    ->whereHas('hocKy', fn ($query) => $query->where('trang_thai', '!=', HocKy::CLOSED))
                    ->pluck('giang_vien_id')
                    ->all();
                $tenDoiTuong = 'giảng viên';
                $thongBaoBiChan = 'Giảng viên còn phụ trách lớp học phần thuộc học kỳ chưa đóng.';
            }

            $biChanIds = array_fill_keys(array_map('strval', $biChanIds), true);
            $ketQua = [];
            $hoSoIdsCanXoa = [];
            $nguoiDungIdsCanXoa = [];
            $nhatKys = [];
            $thoiDiem = now();

            foreach ($ids as $id) {
                $hoSo = $hoSos->get($id);
                if ($hoSo === null) {
                    $ketQua[] = [
                        'id' => $id,
                        'ket_qua' => 'THAT_BAI',
                        'ma_loi' => 'NOT_FOUND',
                        'message' => "Không tìm thấy {$tenDoiTuong}.",
                    ];

                    continue;
                }

                if (isset($biChanIds[(string) $hoSo->id])) {
                    $ketQua[] = [
                        'id' => $id,
                        'ket_qua' => 'THAT_BAI',
                        'ma_loi' => 'DELETE_BLOCKED',
                        'message' => $thongBaoBiChan,
                    ];

                    continue;
                }

                $hoSoIdsCanXoa[] = $hoSo->id;
                $nguoiDungIdsCanXoa[] = $hoSo->user_id;
                $ketQua[] = ['id' => $id, 'ket_qua' => 'THANH_CONG'];
                $nhatKys[] = [
                    'doi_tuong_loai' => $loai,
                    'doi_tuong_id' => $hoSo->id,
                    'hanh_dong' => NhatKy::XOA,
                    'gia_tri_cu' => null,
                    'gia_tri_moi' => null,
                    'nguoi_thuc_hien_id' => auth()->id(),
                    'ghi_chu' => null,
                    'thoi_diem' => $thoiDiem,
                    'created_at' => $thoiDiem,
                    'updated_at' => $thoiDiem,
                ];
            }

            if ($hoSoIdsCanXoa === []) {
                return $ketQua;
            }

            $nguoiDung = new User;
            $tokenRelation = $nguoiDung->tokens();
            DB::table($tokenRelation->getRelated()->getTable())
                ->where('tokenable_type', $nguoiDung->getMorphClass())
                ->whereIn('tokenable_id', $nguoiDungIdsCanXoa)
                ->delete();

            $cotXoaMem = [
                'deleted_by' => auth()->id(),
                'deleted_at' => $thoiDiem,
                'updated_at' => $thoiDiem,
            ];
            DB::table($hoSoMau->getTable())->whereIn('id', $hoSoIdsCanXoa)->update($cotXoaMem);
            DB::table('users')->whereIn('id', $nguoiDungIdsCanXoa)->update($cotXoaMem);
            DB::table('nhat_ky')->insert($nhatKys);

            return $ketQua;
        });
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
