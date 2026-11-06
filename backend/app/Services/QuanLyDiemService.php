<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\HocKy;
use App\Models\LichSuDiem;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

class QuanLyDiemService
{
    public function __construct(private readonly QuanLyCauHinhService $cauHinhService) {}

    /**
     * Nhập hoặc cập nhật điểm cho một sinh viên (đăng ký học phần).
     */
    public function nhapDiemDon(
        DangKyHocPhan $dangKy,
        array $duLieu,
        User $nguoiThucHien,
        ?string $lyDo = null,
    ): array {
        return DB::transaction(function () use ($dangKy, $duLieu, $nguoiThucHien, $lyDo) {
            /** @var LopHocPhan $lop */
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($dangKy->lop_hoc_phan_id);

            if ($nguoiThucHien->laGiangVien()) {
                $giangVienId = $nguoiThucHien->giangVien?->id;
                if ($lop->giang_vien_id !== $giangVienId) {
                    throw new LoiNghiepVu('FORBIDDEN', 'Bạn không phải giảng viên phụ trách lớp này.', 403);
                }
            } elseif (! $nguoiThucHien->laAdmin()) {
                throw new LoiNghiepVu('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
            }

            if ($lop->hocKy?->trang_thai === HocKy::CLOSED) {
                throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng.', 409);
            }

            if ($lop->daChotDiem()) {
                throw new LoiNghiepVu('GRADE_LOCKED', 'Lớp đã chốt điểm.', 409);
            }

            if ($dangKy->trang_thai !== DangKyHocPhan::ACTIVE) {
                throw new LoiNghiepVu('VALIDATION_ERROR', 'Đăng ký không hợp lệ hoặc không ở trạng thái ACTIVE.', 422);
            }

            $phienBanQuyDoi = $this->cauHinhService->layApDungChoHocKy($lop->hocKy);
            $trongSo = $phienBanQuyDoi->trong_so;
            $bangQuyDoi = $phienBanQuyDoi->bang_quy_doi;

            if (! is_array($trongSo) || ! is_array($bangQuyDoi) || $bangQuyDoi === []) {
                throw new LogicException('Thiếu cấu hình trọng số hoặc bảng quy đổi điểm.');
            }

            /** @var Diem $diem */
            $diem = $dangKy->diem()->lockForUpdate()->first()
                ?? new Diem(['dang_ky_hoc_phan_id' => $dangKy->id]);
            $diemDaTonTai = $diem->exists;

            $cacGiaTriCu = [];
            foreach (['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky', 'diem_tong_ket', 'diem_chu', 'xep_loai', 'quy_doi_diem_id', 'diem_he_4', 'ket_qua'] as $truong) {
                $cacGiaTriCu[$truong] = $diem->getAttribute($truong);
            }

            $thanhPhanThayDoi = ! $diemDaTonTai;
            foreach (['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky'] as $truong) {
                if ($this->giaTriDiemAudit($cacGiaTriCu[$truong]) !== $this->giaTriDiemAudit($duLieu[$truong])) {
                    $thanhPhanThayDoi = true;
                    break;
                }
            }

            $ketQuaDiem = $thanhPhanThayDoi
                ? $this->tinhKetQuaDiem($duLieu, $trongSo, $bangQuyDoi)
                : array_intersect_key($cacGiaTriCu, array_flip([
                    'diem_tong_ket',
                    'diem_chu',
                    'xep_loai',
                    'diem_he_4',
                    'ket_qua',
                ]));

            $cacGiaTriMoi = [
                'diem_chuyen_can' => $duLieu['diem_chuyen_can'],
                'diem_giua_ky' => $duLieu['diem_giua_ky'],
                'diem_cuoi_ky' => $duLieu['diem_cuoi_ky'],
                ...$ketQuaDiem,
                'quy_doi_diem_id' => $thanhPhanThayDoi
                    ? ($duLieu['diem_chuyen_can'] === null
                        || $duLieu['diem_giua_ky'] === null
                        || $duLieu['diem_cuoi_ky'] === null
                        ? null
                        : $phienBanQuyDoi->id)
                    : $cacGiaTriCu['quy_doi_diem_id'],
            ];

            $diem->fill($cacGiaTriMoi);
            $diem->save();

            foreach ($cacGiaTriMoi as $truong => $giaTriMoi) {
                $giaTriCu = $cacGiaTriCu[$truong];

                if ($this->giaTriDiemAudit($giaTriCu) === $this->giaTriDiemAudit($giaTriMoi)) {
                    continue;
                }

                LichSuDiem::query()->create([
                    'diem_id' => $diem->id,
                    'truong' => $truong,
                    'gia_tri_cu' => $this->giaTriDiemAudit($giaTriCu),
                    'gia_tri_moi' => $this->giaTriDiemAudit($giaTriMoi),
                    'nguoi_sua_id' => $nguoiThucHien->id,
                    'ly_do' => $lyDo,
                    'thoi_diem' => now(),
                ]);
            }

            return $this->dinhDangDongDiem($dangKy->fresh(['sinhVien.lopHanhChinh', 'diem']), $lop);
        });
    }

    /**
     * Xem lịch sử sửa điểm của một đăng ký học phần.
     */
    public function lichSuDiem(DangKyHocPhan $dangKy, User $nguoiThucHien): array
    {
        $lop = $dangKy->lopHocPhan;

        if ($nguoiThucHien->laGiangVien()) {
            $giangVienId = $nguoiThucHien->giangVien?->id;
            if ($lop->giang_vien_id !== $giangVienId) {
                throw new LoiNghiepVu('FORBIDDEN', 'Bạn không có quyền xem lịch sử sửa điểm của lớp này.', 403);
            }
        } elseif (! $nguoiThucHien->laAdmin()) {
            throw new LoiNghiepVu('FORBIDDEN', 'Bạn không có quyền xem lịch sử sửa điểm.', 403);
        }

        $diem = $dangKy->diem;
        if (! $diem) {
            return [];
        }

        return LichSuDiem::query()
            ->where('diem_id', $diem->id)
            ->with(['nguoiSua' => fn ($q) => $q->select(['id', 'name', 'email'])])
            ->orderByDesc('thoi_diem')
            ->orderByDesc('id')
            ->get()
            ->map(fn (LichSuDiem $item) => [
                'id' => $item->id,
                'truong' => $item->truong,
                'gia_tri_cu' => $item->gia_tri_cu,
                'gia_tri_moi' => $item->gia_tri_moi,
                'ly_do' => $item->ly_do,
                'thoi_diem' => $item->thoi_diem?->format('Y-m-d H:i:s'),
                'nguoi_sua' => [
                    'id' => $item->nguoiSua?->id,
                    'name' => $item->nguoiSua?->name,
                    'email' => $item->nguoiSua?->email,
                ],
            ])
            ->all();
    }

    /**
     * Điểm cá nhân của sinh viên theo học kỳ (SCR-42).
     */
    public function diemCuaToi(User $nguoiThucHien, ?int $hocKyId = null): array
    {
        $sinhVien = $this->laySinhVien($nguoiThucHien);

        $hocKy = null;
        if ($hocKyId !== null) {
            $hocKy = HocKy::query()->find($hocKyId);
            if (! $hocKy) {
                throw new LoiNghiepVu('NOT_FOUND', 'Không tìm thấy học kỳ yêu cầu.', 404);
            }
        } else {
            // Lấy học kỳ mới nhất mà sinh viên có đăng ký, hoặc học kỳ ONGOING
            $hocKy = HocKy::query()
                ->whereHas('lopHocPhan.dangKyHocPhan', fn ($q) => $q->where('sinh_vien_id', $sinhVien->id)->where('trang_thai', DangKyHocPhan::ACTIVE))
                ->orderByDesc('ngay_bat_dau')
                ->first();

            if (! $hocKy) {
                $hocKy = HocKy::query()->where('trang_thai', HocKy::ONGOING)->first()
                    ?? HocKy::query()->orderByDesc('ngay_bat_dau')->first();
            }
        }

        if (! $hocKy) {
            return [
                'hoc_ky' => null,
                'mon_hoc' => [],
                'gpa_he_10' => null,
                'gpa_he_4' => null,
                'tong_tin_chi' => 0,
            ];
        }

        $dangKys = DangKyHocPhan::query()
            ->where('sinh_vien_id', $sinhVien->id)
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->whereHas('lopHocPhan', fn ($q) => $q->where('hoc_ky_id', $hocKy->id))
            ->with(['lopHocPhan.monHoc', 'diem'])
            ->get();

        // Nhóm theo môn học để xử lý học lại (BR-28, ADR-018: lấy điểm cao nhất)
        $monHocGrouped = $dangKys->groupBy(fn ($dk) => $dk->lopHocPhan->mon_hoc_id);

        $monHocList = [];
        $tongTinChi = 0;
        $tongTinChiCoDiem = 0;
        $tongDiem10 = 0.0;
        $tongDiem4 = 0.0;

        foreach ($monHocGrouped as $group) {
            /** @var DangKyHocPhan $best */
            $best = $group->sortByDesc(fn ($dk) => $dk->diem?->diem_tong_ket ?? -1)->first();
            $monHoc = $best->lopHocPhan->monHoc;
            $diem = $best->diem;

            $soTinChi = $monHoc?->so_tin_chi ?? 0;
            $tongTinChi += $soTinChi;

            if ($diem && $diem->diem_tong_ket !== null && $diem->diem_he_4 !== null) {
                $tongTinChiCoDiem += $soTinChi;
                $tongDiem10 += (float) $diem->diem_tong_ket * $soTinChi;
                $tongDiem4 += (float) $diem->diem_he_4 * $soTinChi;
            }

            $monHocList[] = [
                'ma_mon' => $monHoc?->ma_mon,
                'ten_mon' => $monHoc?->ten_mon,
                'so_tin_chi' => $soTinChi,
                'diem_chuyen_can' => $this->soHoacNull($diem?->diem_chuyen_can),
                'diem_giua_ky' => $this->soHoacNull($diem?->diem_giua_ky),
                'diem_cuoi_ky' => $this->soHoacNull($diem?->diem_cuoi_ky),
                'diem_tong_ket' => $this->soHoacNull($diem?->diem_tong_ket),
                'diem_chu' => $diem?->diem_chu,
                'diem_he_4' => $this->soHoacNull($diem?->diem_he_4),
                'ket_qua' => $diem?->ket_qua,
            ];
        }

        $gpa10 = $tongTinChiCoDiem > 0 ? round($tongDiem10 / $tongTinChiCoDiem, 2) : null;
        $gpa4 = $tongTinChiCoDiem > 0 ? round($tongDiem4 / $tongTinChiCoDiem, 2) : null;

        return [
            'hoc_ky' => [
                'id' => $hocKy->id,
                'ma_hoc_ky' => $hocKy->ma_hoc_ky,
                'ten_hoc_ky' => $hocKy->ten_hoc_ky,
            ],
            'mon_hoc' => $monHocList,
            'gpa_he_10' => $gpa10,
            'gpa_he_4' => $gpa4,
            'tong_tin_chi' => $tongTinChi,
        ];
    }

    /**
     * GPA học kỳ hiện tại và CPA tích lũy (FR-12.08).
     */
    public function gpaCuaToi(User $nguoiThucHien): array
    {
        $sinhVien = $this->laySinhVien($nguoiThucHien);

        // 1. Học kỳ hiện tại (ONGOING hoặc gần nhất có đăng ký)
        $hocKyHienTai = HocKy::query()
            ->where('trang_thai', HocKy::ONGOING)
            ->whereHas('lopHocPhan.dangKyHocPhan', fn ($q) => $q->where('sinh_vien_id', $sinhVien->id)->where('trang_thai', DangKyHocPhan::ACTIVE))
            ->first();

        if (! $hocKyHienTai) {
            $hocKyHienTai = HocKy::query()
                ->whereHas('lopHocPhan.dangKyHocPhan', fn ($q) => $q->where('sinh_vien_id', $sinhVien->id)->where('trang_thai', DangKyHocPhan::ACTIVE))
                ->orderByDesc('ngay_bat_dau')
                ->first();
        }

        $hocKyHienTaiData = null;
        if ($hocKyHienTai) {
            $kyData = $this->diemCuaToi($nguoiThucHien, $hocKyHienTai->id);
            $hocKyHienTaiData = [
                'id' => $hocKyHienTai->id,
                'ma_hoc_ky' => $hocKyHienTai->ma_hoc_ky,
                'ten_hoc_ky' => $hocKyHienTai->ten_hoc_ky,
                'gpa_he_10' => $kyData['gpa_he_10'],
                'gpa_he_4' => $kyData['gpa_he_4'],
                'tong_tin_chi' => $kyData['tong_tin_chi'],
            ];
        }

        // 2. CPA tích lũy: chỉ tính các học kỳ CLOSED; mỗi môn tính một lần điểm cao nhất
        $closedDangKys = DangKyHocPhan::query()
            ->where('sinh_vien_id', $sinhVien->id)
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->whereHas('lopHocPhan.hocKy', fn ($q) => $q->where('trang_thai', HocKy::CLOSED))
            ->with(['lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'diem'])
            ->get();

        $monHocClosedGrouped = $closedDangKys->groupBy(fn ($dk) => $dk->lopHocPhan->mon_hoc_id);

        $tongTinChiTichLuy = 0;
        $tongTinChiDat = 0;
        $tongDiem10TichLuy = 0.0;
        $tongDiem4TichLuy = 0.0;
        $soTinChiCoDiem = 0;
        $cacHocKyDaTinh = [];

        foreach ($monHocClosedGrouped as $group) {
            /** @var DangKyHocPhan $best */
            $best = $group->sortByDesc(fn ($dk) => $dk->diem?->diem_tong_ket ?? -1)->first();
            $monHoc = $best->lopHocPhan->monHoc;
            $diem = $best->diem;

            $soTinChi = $monHoc?->so_tin_chi ?? 0;
            $tongTinChiTichLuy += $soTinChi;

            if ($diem && $diem->diem_tong_ket !== null && $diem->diem_he_4 !== null) {
                $soTinChiCoDiem += $soTinChi;
                $tongDiem10TichLuy += (float) $diem->diem_tong_ket * $soTinChi;
                $tongDiem4TichLuy += (float) $diem->diem_he_4 * $soTinChi;
                $cacHocKyDaTinh[$best->lopHocPhan->hoc_ky_id] = true;
            }

            if ($diem && $diem->ket_qua === Diem::DAT) {
                $tongTinChiDat += $soTinChi;
            }
        }

        $cpa10 = $soTinChiCoDiem > 0 ? round($tongDiem10TichLuy / $soTinChiCoDiem, 2) : 0.0;
        $cpa4 = $soTinChiCoDiem > 0 ? round($tongDiem4TichLuy / $soTinChiCoDiem, 2) : 0.0;

        return [
            'hoc_ky_hien_tai' => $hocKyHienTaiData,
            'tich_luy' => [
                'gpa_he_10' => $cpa10,
                'gpa_he_4' => $cpa4,
                'tong_tin_chi' => $tongTinChiTichLuy,
                'tin_chi_dat' => $tongTinChiDat,
                'so_hoc_ky_da_tinh' => count($cacHocKyDaTinh),
            ],
        ];
    }

    /**
     * Tính toán điểm tổng kết và tra bảng quy đổi.
     */
    public function tinhKetQuaDiem(array $diem, array $trongSo, array $bangQuyDoi): array
    {
        $cacDiem = [$diem['diem_chuyen_can'], $diem['diem_giua_ky'], $diem['diem_cuoi_ky']];

        if (in_array(null, $cacDiem, true)) {
            return [
                'diem_tong_ket' => null,
                'diem_chu' => null,
                'xep_loai' => null,
                'diem_he_4' => null,
                'ket_qua' => null,
            ];
        }

        foreach (['chuyen_can', 'giua_ky', 'cuoi_ky'] as $thanhPhan) {
            if (! isset($trongSo[$thanhPhan]) || ! is_numeric($trongSo[$thanhPhan])) {
                throw new LogicException('Cấu hình trọng số điểm không hợp lệ.');
            }
        }

        $tongKet = round(
            (float) $diem['diem_chuyen_can'] * (float) $trongSo['chuyen_can']
                + (float) $diem['diem_giua_ky'] * (float) $trongSo['giua_ky']
                + (float) $diem['diem_cuoi_ky'] * (float) $trongSo['cuoi_ky'],
            2,
        );

        foreach ($bangQuyDoi as $khoang) {
            if (! isset($khoang['tu'], $khoang['den'], $khoang['chu'], $khoang['he_4'])) {
                continue;
            }

            if ($tongKet >= (float) $khoang['tu'] && $tongKet <= (float) $khoang['den']) {
                $dat = isset($khoang['dat']) ? (bool) $khoang['dat'] : ((float) $khoang['he_4'] > 0);
                $xepLoai = $khoang['xep_loai'] ?? match ($khoang['chu']) {
                    'A' => 'Giỏi',
                    'B+', 'B' => 'Khá',
                    'C+', 'C' => 'Trung bình',
                    'D+', 'D' => 'Yếu',
                    default => 'Kém',
                };

                return [
                    'diem_tong_ket' => $tongKet,
                    'diem_chu' => $khoang['chu'],
                    'xep_loai' => $xepLoai,
                    'diem_he_4' => (float) $khoang['he_4'],
                    'ket_qua' => $dat ? Diem::DAT : Diem::KHONG_DAT,
                ];
            }
        }

        return [
            'diem_tong_ket' => $tongKet,
            'diem_chu' => null,
            'xep_loai' => null,
            'diem_he_4' => null,
            'ket_qua' => null,
        ];
    }

    private function laySinhVien(User $nguoiDung): SinhVien
    {
        if (! $nguoiDung->laSinhVien() || ! $nguoiDung->sinhVien) {
            throw new LoiNghiepVu('FORBIDDEN', 'Tài khoản không phải sinh viên.', 403);
        }

        return $nguoiDung->sinhVien;
    }

    private function dinhDangDongDiem(DangKyHocPhan $dangKy, LopHocPhan $lop): array
    {
        /** @var Diem|null $diem */
        $diem = $dangKy->diem;

        return [
            'id' => $diem?->id,
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'sinh_vien' => [
                'id' => $dangKy->sinhVien->id,
                'ma_sv' => $dangKy->sinhVien->ma_sv,
                'ho_ten' => $dangKy->sinhVien->ho_ten,
                'email' => $dangKy->sinhVien->email,
                'lop' => $dangKy->sinhVien->lopHanhChinh?->ten_lop,
                'dang_ky_hoc_phan_id' => $dangKy->id,
            ],
            'diem_chuyen_can' => $this->soHoacNull($diem?->diem_chuyen_can),
            'diem_giua_ky' => $this->soHoacNull($diem?->diem_giua_ky),
            'diem_cuoi_ky' => $this->soHoacNull($diem?->diem_cuoi_ky),
            'diem_tong_ket' => $this->soHoacNull($diem?->diem_tong_ket),
            'diem_chu' => $diem?->diem_chu,
            'diem_he_4' => $this->soHoacNull($diem?->diem_he_4),
            'ket_qua' => $diem?->ket_qua,
            'da_chot_diem' => $lop->daChotDiem(),
        ];
    }

    private function soHoacNull(mixed $giaTri): ?float
    {
        return $giaTri !== null ? (float) $giaTri : null;
    }

    private function giaTriDiemAudit(mixed $giaTri): ?string
    {
        if ($giaTri === null) {
            return null;
        }

        if (is_numeric($giaTri)) {
            return number_format((float) $giaTri, 2, '.', '');
        }

        return (string) $giaTri;
    }
}

