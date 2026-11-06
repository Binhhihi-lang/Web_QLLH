<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\DiemDanh;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\NhatKy;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DangKyHocPhanService
{
    /** @return array<int, array<string, mixed>> */
    public function dangKyHangLoat(LopHocPhan $lop, array $sinhVienIds, int $nguoiThucHienId): array
    {
        $ketQua = [];

        foreach ($sinhVienIds as $sinhVienId) {
            $sinhVien = SinhVien::query()->with('lopHanhChinh')->find($sinhVienId);

            if ($sinhVien === null) {
                $ketQua[] = ['sinh_vien_id' => (int) $sinhVienId, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND', 'message' => 'Không tìm thấy sinh viên.'];

                continue;
            }

            try {
                $dangKy = $this->dangKy($sinhVien, $lop, $nguoiThucHienId, true);
                $ketQua[] = [
                    'sinh_vien_id' => $sinhVien->id,
                    'ma_sv' => $sinhVien->ma_sv,
                    'ket_qua' => 'THANH_CONG',
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                ];
            } catch (LoiNghiepVu $exception) {
                $ketQua[] = [
                    'sinh_vien_id' => $sinhVien->id,
                    'ma_sv' => $sinhVien->ma_sv,
                    'ket_qua' => 'THAT_BAI',
                    'ma_loi' => $exception->maLoi,
                    'message' => $exception->getMessage(),
                ];
            }
        }

        $thanhCong = count(array_filter($ketQua, fn ($dong) => $dong['ket_qua'] === 'THANH_CONG'));

        return [
            'thanh_cong' => $thanhCong,
            'that_bai' => count($ketQua) - $thanhCong,
            'chi_tiet' => $ketQua,
        ];
    }

    public function dangKy(SinhVien $sinhVien, LopHocPhan $lop, int $nguoiThucHienId, bool $adminOverride = false): DangKyHocPhan
    {
        return DB::transaction(function () use ($sinhVien, $lop, $nguoiThucHienId, $adminOverride) {
            $lop = LopHocPhan::query()->with('hocKy')->lockForUpdate()->findOrFail($lop->id);
            $sinhVien = SinhVien::query()->with(['lopHanhChinh', 'user'])->lockForUpdate()->findOrFail($sinhVien->id);
            $this->kiemTraDieuKienDangKy($sinhVien, $lop, $adminOverride);

            $dangKy = DangKyHocPhan::query()
                ->where('sinh_vien_id', $sinhVien->id)
                ->where('lop_hoc_phan_id', $lop->id)
                ->lockForUpdate()
                ->first();

            if ($dangKy?->trang_thai === DangKyHocPhan::ACTIVE) {
                throw new LoiNghiepVu('DUPLICATE_ENROLLMENT', 'Sinh viên đã đăng ký lớp học phần này.');
            }

            if ($dangKy !== null && Diem::query()->where('dang_ky_hoc_phan_id', $dangKy->id)->exists()) {
                throw new LoiNghiepVu('HAS_GRADE_OR_ATTENDANCE', 'Đăng ký cũ đã có điểm, không thể đăng ký lại.');
            }

            if ($lop->trang_thai !== LopHocPhan::OPEN) {
                throw new LoiNghiepVu('SECTION_NOT_OPEN', 'Lớp học phần không nhận đăng ký.');
            }

            $dangKyCungMon = DangKyHocPhan::query()
                ->where('sinh_vien_id', $sinhVien->id)
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('lopHocPhan', fn ($query) => $query
                    ->where('hoc_ky_id', $lop->hoc_ky_id)
                    ->where('mon_hoc_id', $lop->mon_hoc_id));

            if ($dangKy !== null) {
                $dangKyCungMon->whereKeyNot($dangKy->id);
            }

            if ($dangKyCungMon->exists()) {
                throw new LoiNghiepVu('DUPLICATE_SUBJECT_IN_SEMESTER', 'Sinh viên đã đăng ký lớp khác cùng môn trong học kỳ.');
            }

            $dangKyHienTai = $lop->dangKyHocPhan()->where('trang_thai', DangKyHocPhan::ACTIVE)->count();
            if ($dangKyHienTai >= $lop->si_so_toi_da) {
                throw new LoiNghiepVu('SECTION_FULL', 'Lớp học phần đã đủ sĩ số.');
            }

            $this->kiemTraTrungLich($sinhVien, $lop);

            $now = now();
            $laTaoMoi = $dangKy === null;
            $giaTriCu = $dangKy?->only(['trang_thai', 'dang_ky_luc', 'huy_luc', 'ly_do_huy']);
            if ($laTaoMoi) {
                $dangKy = DangKyHocPhan::query()->create([
                    'sinh_vien_id' => $sinhVien->id,
                    'lop_hoc_phan_id' => $lop->id,
                    'trang_thai' => DangKyHocPhan::ACTIVE,
                    'dang_ky_boi' => $nguoiThucHienId,
                    'dang_ky_luc' => $now,
                ]);
            } else {
                $dangKy->update([
                    'trang_thai' => DangKyHocPhan::ACTIVE,
                    'dang_ky_boi' => $nguoiThucHienId,
                    'dang_ky_luc' => $now,
                    'huy_boi' => null,
                    'huy_luc' => null,
                    'ly_do_huy' => null,
                ]);
            }

            if ($adminOverride) {
                NhatKy::ghi(
                    'dang_ky_hoc_phan',
                    $dangKy->id,
                    $laTaoMoi ? NhatKy::TAO : NhatKy::CAP_NHAT,
                    $giaTriCu,
                    [
                        'sinh_vien_id' => $sinhVien->id,
                        'lop_hoc_phan_id' => $lop->id,
                        'trang_thai' => DangKyHocPhan::ACTIVE,
                        'dang_ky_luc' => $now->toDateTimeString(),
                        'huy_boi' => null,
                        'huy_luc' => null,
                        'ly_do_huy' => null,
                    ],
                    nguoiThucHienId: $nguoiThucHienId,
                );
            }

            return $dangKy->fresh()->load($this->quanHeResource());
        });
    }

    public function huy(DangKyHocPhan $dangKy, User $nguoiThucHien, ?string $lyDo = null): DangKyHocPhan
    {
        return DB::transaction(function () use ($dangKy, $nguoiThucHien, $lyDo) {
            $dangKy = DangKyHocPhan::query()->with('lopHocPhan.hocKy')->lockForUpdate()->findOrFail($dangKy->id);
            if ($dangKy->trang_thai !== DangKyHocPhan::ACTIVE) {
                throw new LoiNghiepVu('DUPLICATE_ENROLLMENT', 'Đăng ký này đã được hủy.');
            }

            if (! $nguoiThucHien->laAdmin() && ! $dangKy->lopHocPhan->hocKy->dangMoDangKy()) {
                throw new LoiNghiepVu('OUTSIDE_REGISTRATION', 'Đã ngoài đợt đăng ký, không thể hủy.');
            }

            $coDiem = Diem::query()->where('dang_ky_hoc_phan_id', $dangKy->id)->exists();
            $coDiemDanh = DiemDanh::query()->where('dang_ky_hoc_phan_id', $dangKy->id)->exists();
            if ($coDiem || $coDiemDanh) {
                throw new LoiNghiepVu('HAS_GRADE_OR_ATTENDANCE', 'Đã có điểm hoặc điểm danh, không thể hủy đăng ký.');
            }

            $dangKy->update([
                'trang_thai' => DangKyHocPhan::CANCELLED,
                'huy_boi' => $nguoiThucHien->id,
                'huy_luc' => now(),
                'ly_do_huy' => $lyDo,
            ]);

            if ($nguoiThucHien->laAdmin()) {
                NhatKy::ghi('dang_ky_hoc_phan', $dangKy->id, NhatKy::DOI_TRANG_THAI,
                    ['trang_thai' => DangKyHocPhan::ACTIVE],
                    ['trang_thai' => DangKyHocPhan::CANCELLED, 'ly_do_huy' => $lyDo],
                    nguoiThucHienId: $nguoiThucHien->id);
            }

            return $dangKy->fresh()->load($this->quanHeResource());
        });
    }

    private function kiemTraDieuKienDangKy(SinhVien $sinhVien, LopHocPhan $lop, bool $adminOverride): void
    {
        if (! $sinhVien->trang_thai || ! $sinhVien->user?->trang_thai) {
            throw new LoiNghiepVu('STUDENT_INACTIVE', 'Sinh viên không hoạt động.');
        }

        if ($lop->hocKy->trang_thai === HocKy::CLOSED) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng, không nhận đăng ký.');
        }

        if (! $adminOverride && ! $lop->hocKy->dangMoDangKy()) {
            throw new LoiNghiepVu('OUTSIDE_REGISTRATION', 'Hiện không trong đợt đăng ký của học kỳ này.');
        }

        if (! $adminOverride && $lop->nam_thu !== null) {
            $namThu = $sinhVien->namThuTrong($lop->hocKy);
            if ($namThu !== null && $namThu !== $lop->nam_thu) {
                throw new LoiNghiepVu('WRONG_STUDY_YEAR', 'Lớp dành cho năm thứ khác với năm thứ hiện tại của sinh viên.');
            }
        }
    }

    private function kiemTraTrungLich(SinhVien $sinhVien, LopHocPhan $lop): void
    {
        $buoiMoi = $lop->buoiHoc()->where('trang_thai', 'SCHEDULED')->get();
        if ($buoiMoi->isEmpty()) {
            return;
        }

        $buoiDaDangKy = BuoiHoc::query()
            ->with('lopHocPhan:id,ma_lop_hp')
            ->where('trang_thai', 'SCHEDULED')
            ->whereHas('lopHocPhan.dangKyHocPhan', fn ($query) => $query
                ->where('sinh_vien_id', $sinhVien->id)
                ->where('trang_thai', DangKyHocPhan::ACTIVE))
            ->get();

        foreach ($buoiMoi as $moi) {
            foreach ($buoiDaDangKy as $daDangKy) {
                if ($moi->ngay_hoc->isSameDay($daDangKy->ngay_hoc)
                    && $moi->gio_bat_dau < $daDangKy->gio_ket_thuc
                    && $moi->gio_ket_thuc > $daDangKy->gio_bat_dau) {
                    $ngayHoc = $moi->ngay_hoc->toDateString();
                    $gioBatDauMoi = substr((string) $moi->gio_bat_dau, 0, 5);
                    $gioKetThucMoi = substr((string) $moi->gio_ket_thuc, 0, 5);
                    $gioBatDauDaDangKy = substr((string) $daDangKy->gio_bat_dau, 0, 5);
                    $gioKetThucDaDangKy = substr((string) $daDangKy->gio_ket_thuc, 0, 5);
                    $lopDaDangKy = $daDangKy->lopHocPhan;

                    throw new LoiNghiepVu(
                        'SCHEDULE_CONFLICT',
                        "Lịch lớp {$lop->ma_lop_hp} ngày {$ngayHoc} {$gioBatDauMoi}-{$gioKetThucMoi} bị chồng với lớp {$lopDaDangKy->ma_lop_hp} ngày {$ngayHoc} {$gioBatDauDaDangKy}-{$gioKetThucDaDangKy} bạn đã đăng ký.",
                        errors: [
                            'trung_lich' => [[
                                'lop_moi' => ['ma_lop_hp' => $lop->ma_lop_hp],
                                'buoi_moi' => [
                                    'ngay_hoc' => $ngayHoc,
                                    'gio_bat_dau' => $gioBatDauMoi,
                                    'gio_ket_thuc' => $gioKetThucMoi,
                                ],
                                'lop_da_dang_ky' => ['ma_lop_hp' => $lopDaDangKy->ma_lop_hp],
                                'buoi_da_dang_ky' => [
                                    'ngay_hoc' => $daDangKy->ngay_hoc->toDateString(),
                                    'gio_bat_dau' => $gioBatDauDaDangKy,
                                    'gio_ket_thuc' => $gioKetThucDaDangKy,
                                ],
                            ]],
                        ],
                    );
                }
            }
        }
    }

    /** @return array<int, string> */
    private function quanHeResource(): array
    {
        return ['sinhVien', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'nguoiDangKy', 'nguoiHuy'];
    }
}
