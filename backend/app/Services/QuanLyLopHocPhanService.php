<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\DiemDanh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LichSuDiem;
use App\Models\LopHocPhan;
use App\Models\NhatKy;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Nghiệp vụ module lớp học phần — SCR-25 → SCR-28.
 *
 * FR-08.01 mở lớp · FR-08.03 cập nhật (đổi giảng viên/môn/học kỳ) · FR-08.04 trạng thái ·
 * FR-08.05 kiểm tra hợp lệ · FR-08.06 xóa · BR-14 học kỳ CLOSED chỉ đọc · BR-29 hủy lớp đã chốt điểm.
 */
class QuanLyLopHocPhanService
{
    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function tao(array $duLieu, int $nguoiThucHienId): LopHocPhan
    {
        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            $hocKy = HocKy::query()->findOrFail($duLieu['hoc_ky_id']);
            $this->chanKhiHocKyDaDong($hocKy);

            $lop = LopHocPhan::query()->create($duLieu);

            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::TAO,
                null,
                $this->duLieuGhiNhatKy($lop),
                nguoiThucHienId: $nguoiThucHienId,
            );

            // fresh() để lấy `trang_thai` do DB gán mặc định khi payload không gửi lên.
            return $lop->fresh()->load($this->quanHeCanThiet());
        });
    }

    /**
     * FR-08.03 — ADMIN sửa thông tin, đổi giảng viên (kiểm tra trùng lịch), đổi môn/học kỳ.
     *
     * @param  array<string, mixed>  $duLieu
     */
    public function capNhat(LopHocPhan $lop, array $duLieu, int $nguoiThucHienId): LopHocPhan
    {
        return DB::transaction(function () use ($lop, $duLieu, $nguoiThucHienId) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);
            $this->chanKhiHocKyDaDong($lop->hocKy);

            $hocKyMoi = HocKy::query()->findOrFail($duLieu['hoc_ky_id'] ?? $lop->hoc_ky_id);
            $this->chanKhiHocKyDaDong($hocKyMoi);

            $this->chanKhiDoiMonHoacHocKy($lop, $duLieu);
            $this->chanKhiTrungLichGiangVien($lop, $duLieu);

            $truoc = $this->duLieuGhiNhatKy($lop);
            $trangThaiMoi = $duLieu['trang_thai'] ?? null;
            unset($duLieu['trang_thai']);

            $lop->update($duLieu);

            if ($trangThaiMoi !== null && $trangThaiMoi !== $lop->trang_thai) {
                $this->apDungTrangThai($lop, $trangThaiMoi, $nguoiThucHienId);
            }

            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::CAP_NHAT,
                $truoc,
                $this->duLieuGhiNhatKy($lop->fresh()),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $lop->fresh()->load($this->quanHeCanThiet());
        });
    }

    /**
     * FR-08.04 — chuyển trạng thái lớp. Sang CANCELLED thì hủy đăng ký ACTIVE và buổi SCHEDULED.
     */
    public function doiTrangThai(LopHocPhan $lop, string $trangThaiMoi, int $nguoiThucHienId): LopHocPhan
    {
        return DB::transaction(function () use ($lop, $trangThaiMoi, $nguoiThucHienId) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);
            $this->chanKhiHocKyDaDong($lop->hocKy);

            $trangThaiCu = $lop->trang_thai;
            $this->apDungTrangThai($lop, $trangThaiMoi, $nguoiThucHienId);

            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::DOI_TRANG_THAI,
                ['trang_thai' => $trangThaiCu],
                ['trang_thai' => $trangThaiMoi],
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $lop->fresh()->load($this->quanHeCanThiet());
        });
    }

    /**
     * FR-08.06 — xóa mềm lớp và các buổi học của lớp. Chặn nếu còn đăng ký ACTIVE.
     */
    public function xoa(LopHocPhan $lop, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($lop, $nguoiThucHienId) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);
            $this->chanKhiHocKyDaDong($lop->hocKy);

            $conDangKy = $lop->dangKyHocPhan()
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->exists();

            if ($conDangKy) {
                throw new LoiNghiepVu(
                    'DELETE_BLOCKED',
                    'Lớp học phần còn sinh viên đang đăng ký, không xóa được.',
                );
            }

            $lop->buoiHoc()->get()->each(function (BuoiHoc $buoi) use ($nguoiThucHienId) {
                $buoi->deleted_by = $nguoiThucHienId;
                $buoi->save();
                $buoi->delete();
            });

            $lop->deleted_by = $nguoiThucHienId;
            $lop->save();
            $lop->delete();

            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::XOA,
                $this->duLieuGhiNhatKy($lop),
                null,
                nguoiThucHienId: $nguoiThucHienId,
            );
        });
    }

    /**
     * Lưu điểm hàng loạt cho các đăng ký ACTIVE của lớp.
     *
     * @param  array<int, array{dang_ky_hoc_phan_id: int, diem_chuyen_can: int|float|null, diem_giua_ky: int|float|null, diem_cuoi_ky: int|float|null}>  $cacDong
     * @return array<int, array<string, mixed>>
     */
    public function capNhatDiemHangLoat(
        LopHocPhan $lop,
        array $cacDong,
        int $nguoiThucHienId,
        ?string $lyDo = null,
    ): array {
        return DB::transaction(function () use ($lop, $cacDong, $nguoiThucHienId, $lyDo) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);
            $this->chanKhiHocKyDaDong($lop->hocKy);

            if ($lop->daChotDiem()) {
                throw new LoiNghiepVu('GRADE_LOCKED', 'Lớp đã chốt điểm.');
            }

            $trongSo = CauHinh::lay('diem.trong_so');
            $bangQuyDoi = CauHinh::lay('diem.bang_quy_doi');

            if (! is_array($trongSo) || ! is_array($bangQuyDoi) || $bangQuyDoi === []) {
                throw new LogicException('Thiếu cấu hình trọng số hoặc bảng quy đổi điểm.');
            }

            foreach ($cacDong as $dong) {
                $dangKy = $lop->dangKyHocPhan()
                    ->whereKey($dong['dang_ky_hoc_phan_id'])
                    ->where('trang_thai', DangKyHocPhan::ACTIVE)
                    ->lockForUpdate()
                    ->firstOrFail();

                $diem = Diem::query()->firstOrNew([
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                ]);
                $cacGiaTriCu = [];

                foreach (['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky', 'diem_tong_ket', 'diem_chu', 'diem_he_4', 'ket_qua'] as $truong) {
                    $cacGiaTriCu[$truong] = $diem->getAttribute($truong);
                }

                $cacGiaTriMoi = [
                    'diem_chuyen_can' => $dong['diem_chuyen_can'],
                    'diem_giua_ky' => $dong['diem_giua_ky'],
                    'diem_cuoi_ky' => $dong['diem_cuoi_ky'],
                    ...$this->tinhKetQuaDiem($dong, $trongSo, $bangQuyDoi),
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
                        'nguoi_sua_id' => $nguoiThucHienId,
                        'ly_do' => $lyDo,
                        'thoi_diem' => now(),
                    ]);
                }
            }

            return $this->bangDiem($lop->fresh());
        });
    }

    /**
     * Chốt điểm cả lớp. Điều kiện: mọi đăng ký ACTIVE đã đủ 3 điểm thành phần.
     *
     * @return array{0: LopHocPhan, 1: int} Lớp đã chốt và số dòng điểm đã chốt
     */
    public function chotDiem(LopHocPhan $lop, int $nguoiThucHienId): array
    {
        return DB::transaction(function () use ($lop, $nguoiThucHienId) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);
            $this->chanKhiHocKyDaDong($lop->hocKy);

            if ($lop->daChotDiem()) {
                throw new LoiNghiepVu('GRADE_LOCKED', 'Lớp đã chốt điểm.');
            }

            $soDangKyActive = $lop->dangKyHocPhan()
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->count();

            if ($soDangKyActive === 0) {
                throw new LoiNghiepVu(
                    'NO_ACTIVE_ENROLLMENTS',
                    'Lớp chưa có sinh viên đăng ký đang hoạt động, không thể chốt điểm.',
                );
            }

            $thieuDiem = $this->danhSachThieuDiemThanhPhan($lop);

            if ($thieuDiem !== []) {
                throw new LoiNghiepVu(
                    'GRADE_INCOMPLETE',
                    'Còn sinh viên chưa đủ điểm thành phần, không chốt được.',
                    errors: ['thieu_diem' => $thieuDiem],
                );
            }

            $lop->chot_diem_luc = now();
            $lop->chot_diem_boi = $nguoiThucHienId;
            $lop->save();

            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::CHOT_DIEM,
                null,
                ['chot_diem_luc' => $lop->chot_diem_luc->toDateTimeString()],
                nguoiThucHienId: $nguoiThucHienId,
            );

            $soDongDiem = $lop->dangKyHocPhan()
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('diem')
                ->count();

            return [$lop->fresh()->load($this->quanHeCanThiet()), $soDongDiem];
        });
    }

    /**
     * Mở khóa điểm (ADMIN). Idempotent: lớp chưa chốt thì không làm gì, trả `false`
     * để controller báo đúng sự thật thay vì dựng mã lỗi không có trong hợp đồng.
     *
     * @return array{0: LopHocPhan, 1: bool} Lớp và cờ "có thật sự mở khóa"
     */
    public function moKhoaDiem(LopHocPhan $lop, string $lyDo, int $nguoiThucHienId): array
    {
        return DB::transaction(function () use ($lop, $lyDo, $nguoiThucHienId) {
            $lop = LopHocPhan::query()->lockForUpdate()->findOrFail($lop->id);

            if (! $lop->daChotDiem()) {
                return [$lop->load($this->quanHeCanThiet()), false];
            }

            $cu = $lop->chot_diem_luc->toDateTimeString();
            $lop->chot_diem_luc = null;
            $lop->chot_diem_boi = null;
            $lop->save();

            // Mở khóa điểm là thao tác nhạy cảm nhất trong module điểm: luôn ghi nhật ký
            // kèm lý do, kể cả khi sau này có thêm đường mở khóa khác.
            NhatKy::ghi(
                'lop_hoc_phan',
                $lop->id,
                NhatKy::MO_KHOA,
                ['chot_diem_luc' => $cu],
                ['chot_diem_luc' => null],
                ghiChu: $lyDo,
                nguoiThucHienId: $nguoiThucHienId,
            );

            return [$lop->fresh()->load($this->quanHeCanThiet()), true];
        });
    }

    /**
     * Danh sách sinh viên đang học lớp (đăng ký ACTIVE) — SCR-28.
     *
     * @return array<int, array<string, mixed>>
     */
    public function danhSachSinhVien(LopHocPhan $lop): array
    {
        return $lop->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->with(['sinhVien.lopHanhChinh'])
            ->orderBy('id')
            ->get()
            ->map(function (DangKyHocPhan $dangKy) {
                $sinhVien = $dangKy->sinhVien;

                return [
                    'id' => $sinhVien->id,
                    'ma_sv' => $sinhVien->ma_sv,
                    'ho_ten' => $sinhVien->ho_ten,
                    'email' => $sinhVien->email,
                    'lop' => $sinhVien->lopHanhChinh?->ten_lop,
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                ];
            })
            ->all();
    }

    /**
     * Bảng điểm cả lớp — SCR-29/SCR-41.
     *
     * @return array<int, array<string, mixed>>
     */
    public function bangDiem(LopHocPhan $lop): array
    {
        return $lop->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->with(['sinhVien.lopHanhChinh', 'diem'])
            ->orderBy('id')
            ->get()
            ->map(function (DangKyHocPhan $dangKy) use ($lop) {
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
            })
            ->all();
    }

    /**
     * Thống kê chuyên cần cả lớp — SCR-40.
     *
     * Tỷ lệ chuyên cần = (PRESENT + LATE) / (số buổi đã điểm danh − EXCUSED).
     * Buổi vắng có phép bị loại khỏi mẫu số (docs/06-test-plan.md §4). Mẫu số bằng 0 → `null`.
     *
     * @return array<string, mixed>
     */
    public function thongKeChuyenCan(LopHocPhan $lop): array
    {
        $dangKys = $lop->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->with(['sinhVien.lopHanhChinh'])
            ->orderBy('id')
            ->get();

        $theoDangKy = DiemDanh::query()
            ->whereIn('dang_ky_hoc_phan_id', $dangKys->pluck('id'))
            ->get()
            ->groupBy('dang_ky_hoc_phan_id');

        $tongBuoi = $lop->buoiHoc()->count();

        $sinhVien = $dangKys->map(function (DangKyHocPhan $dangKy) use ($theoDangKy) {
            $banGhi = $theoDangKy->get($dangKy->id, collect());
            $dem = fn (string $trangThai) => $banGhi->where('trang_thai', $trangThai)->count();

            $coMat = $dem(DiemDanh::PRESENT);
            $diMuon = $dem(DiemDanh::LATE);
            $vang = $dem(DiemDanh::ABSENT);
            $coPhep = $dem(DiemDanh::EXCUSED);
            $mauSo = $coMat + $diMuon + $vang;

            return [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'sinh_vien' => [
                    'id' => $dangKy->sinhVien->id,
                    'ma_sv' => $dangKy->sinhVien->ma_sv,
                    'ho_ten' => $dangKy->sinhVien->ho_ten,
                    'email' => $dangKy->sinhVien->email,
                    'lop' => $dangKy->sinhVien->lopHanhChinh?->ten_lop,
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                ],
                'co_mat' => $coMat,
                'di_muon' => $diMuon,
                'vang' => $vang,
                'co_phep' => $coPhep,
                'ty_le' => $mauSo === 0 ? null : round(($coMat + $diMuon) / $mauSo, 4),
            ];
        })->all();

        return [
            'lop_hoc_phan_id' => $lop->id,
            'ma_lop_hp' => $lop->ma_lop_hp,
            'tong_buoi' => $tongBuoi,
            'sinh_vien' => $sinhVien,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function danhSachThieuDiemThanhPhan(LopHocPhan $lop): array
    {
        return $lop->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->with(['sinhVien', 'diem'])
            ->get()
            ->filter(fn (DangKyHocPhan $dangKy) => $dangKy->diem === null || ! $dangKy->diem->duDiemThanhPhan())
            ->map(fn (DangKyHocPhan $dangKy) => [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'ma_sv' => $dangKy->sinhVien?->ma_sv,
                'ho_ten' => $dangKy->sinhVien?->ho_ten,
            ])
            ->values()
            ->all();
    }

    /**
     * Áp dụng trạng thái mới cho lớp, kèm hiệu ứng phụ khi hủy lớp (FR-08.04).
     */
    private function apDungTrangThai(LopHocPhan $lop, string $trangThaiMoi, int $nguoiThucHienId): void
    {
        if ($trangThaiMoi === LopHocPhan::CANCELLED) {
            // BR-29: phải mở khóa điểm trước khi hủy lớp đã chốt.
            if ($lop->daChotDiem()) {
                throw new LoiNghiepVu(
                    'GRADE_LOCKED',
                    'Lớp đã chốt điểm, phải mở khóa điểm trước khi hủy.',
                );
            }

            $lop->dangKyHocPhan()
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->update([
                    'trang_thai' => DangKyHocPhan::CANCELLED,
                    'huy_boi' => $nguoiThucHienId,
                    'huy_luc' => now(),
                    'ly_do_huy' => 'Hủy lớp học phần',
                    'updated_at' => now(),
                ]);

            $lop->buoiHoc()
                ->where('trang_thai', BuoiHoc::SCHEDULED)
                ->update([
                    'trang_thai' => BuoiHoc::CANCELLED,
                    'ly_do_huy' => 'Hủy lớp học phần',
                    'updated_at' => now(),
                ]);
        }

        $lop->trang_thai = $trangThaiMoi;
        $lop->save();
    }

    /**
     * FR-08.03 — đổi môn hoặc đổi học kỳ bị chặn khi lớp đã có đăng ký khác CANCELLED.
     *
     * @param  array<string, mixed>  $duLieu
     */
    private function chanKhiDoiMonHoacHocKy(LopHocPhan $lop, array $duLieu): void
    {
        $coDangKy = $lop->dangKyHocPhan()
            ->where('trang_thai', '!=', DangKyHocPhan::CANCELLED)
            ->exists();

        if (! $coDangKy) {
            return;
        }

        if (isset($duLieu['mon_hoc_id']) && (int) $duLieu['mon_hoc_id'] !== $lop->mon_hoc_id) {
            throw new LoiNghiepVu(
                'SUBJECT_CHANGE_BLOCKED',
                'Lớp đã có đăng ký, không đổi được môn học.',
            );
        }

        if (isset($duLieu['hoc_ky_id']) && (int) $duLieu['hoc_ky_id'] !== $lop->hoc_ky_id) {
            throw new LoiNghiepVu(
                'SEMESTER_CHANGE_BLOCKED',
                'Lớp đã có đăng ký, không đổi được học kỳ.',
            );
        }
    }

    /**
     * FR-08.03 — đổi giảng viên thì kiểm tra trùng lịch trên các buổi SCHEDULED.
     *
     * @param  array<string, mixed>  $duLieu
     */
    private function chanKhiTrungLichGiangVien(LopHocPhan $lop, array $duLieu): void
    {
        if (! isset($duLieu['giang_vien_id']) || (int) $duLieu['giang_vien_id'] === $lop->giang_vien_id) {
            return;
        }

        $buoiCuaLop = $lop->buoiHoc()
            ->where('trang_thai', BuoiHoc::SCHEDULED)
            ->get(['ngay_hoc', 'gio_bat_dau', 'gio_ket_thuc']);

        if ($buoiCuaLop->isEmpty()) {
            return;
        }

        $giangVienMoi = GiangVien::query()->findOrFail($duLieu['giang_vien_id']);

        $trungLich = BuoiHoc::query()
            ->where('trang_thai', BuoiHoc::SCHEDULED)
            ->whereHas('lopHocPhan', fn ($truyVan) => $truyVan
                ->where('giang_vien_id', $giangVienMoi->id)
                ->where('id', '!=', $lop->id))
            ->where(function ($truyVan) use ($buoiCuaLop) {
                foreach ($buoiCuaLop as $buoi) {
                    $truyVan->orWhere(fn ($dieuKien) => $dieuKien
                        ->whereDate('ngay_hoc', $buoi->ngay_hoc)
                        ->where('gio_bat_dau', '<', $buoi->gio_ket_thuc)
                        ->where('gio_ket_thuc', '>', $buoi->gio_bat_dau));
                }
            })
            ->with('lopHocPhan:id,ma_lop_hp')
            ->get()
            ->map(fn (BuoiHoc $buoi) => [
                'ngay_hoc' => $buoi->ngay_hoc->format('Y-m-d'),
                'gio_bat_dau' => $buoi->gio_bat_dau,
                'gio_ket_thuc' => $buoi->gio_ket_thuc,
                'loai' => 'giang_vien',
                'doi_tuong' => $giangVienMoi->ma_gv,
                'ma_lop_hp' => $buoi->lopHocPhan?->ma_lop_hp,
            ])
            ->values()
            ->all();

        if ($trungLich !== []) {
            throw new LoiNghiepVu(
                'SCHEDULE_CONFLICT',
                'Giảng viên mới bị trùng lịch với lớp khác.',
                errors: ['trung_lich' => $trungLich],
            );
        }
    }

    /**
     * BR-14: học kỳ CLOSED chỉ đọc, mọi thao tác ghi đều bị chặn.
     */
    private function chanKhiHocKyDaDong(?HocKy $hocKy): void
    {
        if ($hocKy?->trang_thai === HocKy::CLOSED) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng, chỉ đọc.');
        }
    }

    /**
     * @param  array<string, int|float|null>  $diem
     * @param  array<string, int|float>  $trongSo
     * @param  array<int, array{tu: int|float, den: int|float, chu: string, he_4: int|float, dat: bool}>  $bangQuyDoi
     * @return array{diem_tong_ket: float|null, diem_chu: string|null, diem_he_4: float|null, ket_qua: string|null}
     */
    private function tinhKetQuaDiem(array $diem, array $trongSo, array $bangQuyDoi): array
    {
        $cacDiem = [$diem['diem_chuyen_can'], $diem['diem_giua_ky'], $diem['diem_cuoi_ky']];

        if (in_array(null, $cacDiem, true)) {
            return [
                'diem_tong_ket' => null,
                'diem_chu' => null,
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
            if (! isset($khoang['tu'], $khoang['den'], $khoang['chu'], $khoang['he_4'], $khoang['dat'])) {
                throw new LogicException('Cấu hình bảng quy đổi điểm không hợp lệ.');
            }

            if ($tongKet >= (float) $khoang['tu'] && $tongKet <= (float) $khoang['den']) {
                return [
                    'diem_tong_ket' => $tongKet,
                    'diem_chu' => $khoang['chu'],
                    'diem_he_4' => (float) $khoang['he_4'],
                    'ket_qua' => $khoang['dat'] ? Diem::DAT : Diem::KHONG_DAT,
                ];
            }
        }

        throw new LogicException('Bảng quy đổi điểm không bao phủ điểm tổng kết.');
    }

    private function giaTriDiemAudit(mixed $giaTri): ?string
    {
        if ($giaTri === null) {
            return null;
        }

        return is_numeric($giaTri)
            ? number_format((float) $giaTri, 2, '.', '')
            : (string) $giaTri;
    }

    /**
     * @return array<int, string>
     */
    private function quanHeCanThiet(): array
    {
        return ['monHoc', 'hocKy', 'giangVien'];
    }

    /**
     * @return array<string, mixed>
     */
    private function duLieuGhiNhatKy(LopHocPhan $lop): array
    {
        return $lop->only([
            'ma_lop_hp',
            'mon_hoc_id',
            'hoc_ky_id',
            'giang_vien_id',
            'si_so_toi_da',
            'nam_thu',
            'trang_thai',
        ]);
    }

    /**
     * Cột `decimal:2` của Eloquent trả chuỗi; hợp đồng khai số hoặc null.
     */
    private function soHoacNull(mixed $giaTri): ?float
    {
        return $giaTri === null ? null : (float) $giaTri;
    }
}
