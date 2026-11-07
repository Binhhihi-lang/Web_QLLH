<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\DiemDanh;
use App\Models\HocKy;
use App\Models\NhatKy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuanLyDiemDanhService
{
    /**
     * Lấy danh sách sinh viên và trạng thái điểm danh cho một buổi học.
     */
    public function layDanhSachDiemDanh(BuoiHoc $buoiHoc, User $user): array
    {
        $buoiHoc->loadMissing([
            'lopHocPhan.monHoc',
            'lopHocPhan.hocKy',
            'phongHoc',
        ]);

        $lop = $buoiHoc->lopHocPhan;

        // Phân quyền: ADMIN hoặc GIANG_VIEN phụ trách lớp
        if ($user->laGiangVien()) {
            if ($user->giangVien === null || $lop->giang_vien_id !== $user->giangVien->id) {
                abort(403, 'Bạn không có quyền xem điểm danh của lớp này.');
            }
        } elseif (! $user->laAdmin()) {
            abort(403, 'Bạn không có quyền thực hiện chức năng này.');
        }

        $coTheSua = $this->kiemTraCoTheSua($buoiHoc, $user);

        // BR-21: Lấy danh sách đăng ký hiệu lực tại thời điểm buổi học
        // Bao gồm: Đăng ký ACTIVE (có dang_ky_luc <= kết thúc buổi)
        // hoặc đăng ký đã có bản ghi điểm danh trong buổi này
        $thoiDiemKetThucBuoi = Carbon::parse($buoiHoc->ngay_hoc->toDateString().' '.$buoiHoc->gio_ket_thuc);
        $thoiDiemBatDauBuoi = Carbon::parse($buoiHoc->ngay_hoc->toDateString().' '.$buoiHoc->gio_bat_dau);

        $dangKys = DangKyHocPhan::query()
            ->where('lop_hoc_phan_id', $lop->id)
            ->where(function ($q) use ($buoiHoc, $thoiDiemKetThucBuoi, $thoiDiemBatDauBuoi) {
                $q->where(function ($activeQ) use ($thoiDiemKetThucBuoi) {
                    $activeQ->where('trang_thai', DangKyHocPhan::ACTIVE)
                        ->where('dang_ky_luc', '<=', $thoiDiemKetThucBuoi);
                })->orWhere(function ($cancelledQ) use ($thoiDiemBatDauBuoi, $thoiDiemKetThucBuoi) {
                    // Sinh viên hủy sau khi buổi học bắt đầu vẫn giữ danh sách
                    $cancelledQ->where('trang_thai', DangKyHocPhan::CANCELLED)
                        ->where('dang_ky_luc', '<=', $thoiDiemKetThucBuoi)
                        ->where('huy_luc', '>', $thoiDiemBatDauBuoi);
                })->orWhereHas('diem', fn () => null) // hoặc đã có điểm danh
                    ->orWhereHas('lopHocPhan.buoiHoc.diemDanh', fn ($ddQ) => $ddQ->where('buoi_hoc_id', $buoiHoc->id));
            })
            ->with(['sinhVien.lopHanhChinh'])
            ->get();

        $diemDanhRecords = DiemDanh::query()
            ->where('buoi_hoc_id', $buoiHoc->id)
            ->with('nguoiDiemDanh')
            ->get()
            ->keyBy('dang_ky_hoc_phan_id');

        $danhSach = $dangKys->map(function (DangKyHocPhan $dk) use ($diemDanhRecords) {
            /** @var DiemDanh|null $dd */
            $dd = $diemDanhRecords->get($dk->id);

            return [
                'dang_ky_hoc_phan_id' => $dk->id,
                'sinh_vien' => [
                    'id' => $dk->sinhVien->id,
                    'ma_sv' => $dk->sinhVien->ma_sv,
                    'ho_ten' => $dk->sinhVien->ho_ten,
                    'email' => $dk->sinhVien->email,
                    'lop' => $dk->sinhVien->lopHanhChinh?->ten_lop,
                ],
                'trang_thai' => $dd?->trang_thai,
                'ghi_chu' => $dd?->ghi_chu,
                'diem_danh_luc' => $dd?->diem_danh_luc?->toIso8601String(),
                'diem_danh_boi' => $dd?->nguoiDiemDanh?->name,
            ];
        })->values()->all();

        return [
            'buoi_hoc' => [
                'id' => $buoiHoc->id,
                'ngay_hoc' => $buoiHoc->ngay_hoc->toDateString(),
                'gio_bat_dau' => substr($buoiHoc->gio_bat_dau, 0, 5),
                'gio_ket_thuc' => substr($buoiHoc->gio_ket_thuc, 0, 5),
                'trang_thai' => $buoiHoc->trang_thai,
                'ly_do_huy' => $buoiHoc->ly_do_huy,
                'phong_hoc' => $buoiHoc->phongHoc ? [
                    'id' => $buoiHoc->phongHoc->id,
                    'ma_phong' => $buoiHoc->phongHoc->ma_phong,
                    'ten_phong' => $buoiHoc->phongHoc->ten_phong,
                ] : null,
                'lop_hoc_phan' => [
                    'id' => $lop->id,
                    'ma_lop_hp' => $lop->ma_lop_hp,
                    'ten_mon_hoc' => $lop->monHoc?->ten_mon,
                    'hoc_ky' => $lop->hocKy ? [
                        'id' => $lop->hocKy->id,
                        'ma_hoc_ky' => $lop->hocKy->ma_hoc_ky,
                        'trang_thai' => $lop->hocKy->trang_thai,
                    ] : null,
                ],
                'co_the_sua' => $coTheSua,
            ],
            'danh_sach' => $danhSach,
        ];
    }

    /**
     * Lưu điểm danh hàng loạt cho một buổi học.
     */
    public function luuDiemDanh(BuoiHoc $buoiHoc, array $danhSachDiemDanh, User $user): array
    {
        $buoiHoc->loadMissing(['lopHocPhan.hocKy']);
        $lop = $buoiHoc->lopHocPhan;

        // Phân quyền: ADMIN hoặc GIANG_VIEN phụ trách
        if ($user->laGiangVien()) {
            if ($user->giangVien === null || $lop->giang_vien_id !== $user->giangVien->id) {
                abort(403, 'Bạn không phải giảng viên phụ trách lớp này.');
            }
        } elseif (! $user->laAdmin()) {
            abort(403, 'Bạn không có quyền thực hiện chức năng này.');
        }

        // BR-14, ADR-017: Học kỳ CLOSED chỉ có ADMIN được sửa điểm danh
        if ($lop->hocKy?->trang_thai === HocKy::CLOSED && ! $user->laAdmin()) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã kết thúc, không thể điểm danh.', 409);
        }

        // BR-21, FR-11.03: Quá 7 ngày kể từ khi kết thúc buổi học chỉ ADMIN được sửa
        if (! $user->laAdmin()) {
            $soNgay = (int) CauHinh::lay('diem.diem_danh.sua_trong_so_ngay', 7);
            $thoiDiemKetThuc = Carbon::parse($buoiHoc->ngay_hoc->toDateString().' '.$buoiHoc->gio_ket_thuc);
            if (now()->gt($thoiDiemKetThuc->copy()->addDays($soNgay))) {
                throw new LoiNghiepVu('ATTENDANCE_EDIT_EXPIRED', 'Đã quá hạn sửa điểm danh (quá 7 ngày kể từ khi kết thúc buổi học).', 409);
            }
        }

        // Kiểm tra tất cả dang_ky_hoc_phan_id thuộc về lớp học phần này
        $hopLeIds = DangKyHocPhan::query()
            ->where('lop_hoc_phan_id', $lop->id)
            ->pluck('id')
            ->all();

        foreach ($danhSachDiemDanh as $item) {
            if (! in_array($item['dang_ky_hoc_phan_id'], $hopLeIds, true)) {
                throw new LoiNghiepVu('ENROLLMENT_NOT_IN_SECTION', 'Đăng ký học phần #'.$item['dang_ky_hoc_phan_id'].' không thuộc lớp học phần này.', 422);
            }
        }

        // Thực hiện lưu dữ liệu trong Transaction
        DB::transaction(function () use ($buoiHoc, $danhSachDiemDanh, $user) {
            $thoiDiem = now();

            foreach ($danhSachDiemDanh as $item) {
                DiemDanh::updateOrCreate(
                    [
                        'buoi_hoc_id' => $buoiHoc->id,
                        'dang_ky_hoc_phan_id' => $item['dang_ky_hoc_phan_id'],
                    ],
                    [
                        'trang_thai' => $item['trang_thai'],
                        'ghi_chu' => $item['ghi_chu'] ?? null,
                        'diem_danh_boi' => $user->id,
                        'diem_danh_luc' => $thoiDiem,
                    ]
                );
            }

            // Chuyển trạng thái buổi học SCHEDULED -> DONE
            if ($buoiHoc->trang_thai === BuoiHoc::SCHEDULED) {
                $buoiHoc->update(['trang_thai' => BuoiHoc::DONE]);
            }

            // Ghi nhật ký
            NhatKy::ghi(
                'buoi_hoc',
                $buoiHoc->id,
                NhatKy::CAP_NHAT,
                nguoiThucHienId: $user->id,
                ghiChu: 'Điểm danh buổi học: '.count($danhSachDiemDanh).' sinh viên'
            );
        });

        return [
            'buoi_hoc_id' => $buoiHoc->id,
            'so_luong' => count($danhSachDiemDanh),
            'trang_thai_buoi_hoc' => $buoiHoc->fresh()->trang_thai,
        ];
    }

    /**
     * Sinh viên xem lịch sử điểm danh của bản thân theo từng buổi học.
     */
    public function diemDanhCuaToi(
        User $user,
        ?int $hocKyId = null,
        ?int $lopHocPhanId = null,
        ?int $monHocId = null,
        int $perPage = 10
    ): LengthAwarePaginator {
        $sinhVien = $user->sinhVien;
        if ($sinhVien === null) {
            abort(404, 'Không tìm thấy hồ sơ sinh viên.');
        }

        $dangKys = DangKyHocPhan::query()
            ->where('sinh_vien_id', $sinhVien->id)
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->when($lopHocPhanId, fn ($q) => $q->where('lop_hoc_phan_id', $lopHocPhanId))
            ->when($hocKyId, fn ($q) => $q->whereHas('lopHocPhan', fn ($lop) => $lop->where('hoc_ky_id', $hocKyId)))
            ->when($monHocId, fn ($q) => $q->whereHas('lopHocPhan', fn ($lop) => $lop->where('mon_hoc_id', $monHocId)))
            ->pluck('id', 'lop_hoc_phan_id');

        $buoiHocQuery = BuoiHoc::query()
            ->whereIn('lop_hoc_phan_id', $dangKys->keys())
            ->with([
                'lopHocPhan.monHoc',
                'lopHocPhan.hocKy',
                'lopHocPhan.giangVien',
                'phongHoc',
                'diemDanh' => fn ($q) => $q->whereIn('dang_ky_hoc_phan_id', $dangKys->values()),
            ])
            ->orderByDesc('ngay_hoc')
            ->orderByDesc('gio_bat_dau');

        return $buoiHocQuery->paginate($perPage)->through(function (BuoiHoc $buoi) use ($dangKys) {
            $dkId = $dangKys[$buoi->lop_hoc_phan_id] ?? null;
            $dd = $buoi->diemDanh->firstWhere('dang_ky_hoc_phan_id', $dkId);

            return [
                'id' => $buoi->id,
                'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
                'gio_bat_dau' => substr($buoi->gio_bat_dau, 0, 5),
                'gio_ket_thuc' => substr($buoi->gio_ket_thuc, 0, 5),
                'trang_thai_buoi_hoc' => $buoi->trang_thai,
                'lop_hoc_phan' => [
                    'id' => $buoi->lopHocPhan->id,
                    'ma_lop_hp' => $buoi->lopHocPhan->ma_lop_hp,
                    'ten_mon' => $buoi->lopHocPhan->monHoc?->ten_mon,
                    'ma_mon' => $buoi->lopHocPhan->monHoc?->ma_mon,
                    'hoc_ky' => $buoi->lopHocPhan->hocKy?->ten_hoc_ky,
                ],
                'giang_vien' => $buoi->lopHocPhan->giangVien?->ho_ten,
                'phong_hoc' => $buoi->phongHoc ? [
                    'ma_phong' => $buoi->phongHoc->ma_phong,
                    'ten_phong' => $buoi->phongHoc->ten_phong,
                ] : null,
                'diem_danh' => $dd ? [
                    'trang_thai' => $dd->trang_thai,
                    'ghi_chu' => $dd->ghi_chu,
                    'diem_danh_luc' => $dd->diem_danh_luc?->toIso8601String(),
                ] : null,
            ];
        });
    }

    /**
     * Sinh viên xem thống kê chuyên cần tổng hợp theo từng lớp học phần đã đăng ký.
     */
    public function thongKeCuaToi(User $user, ?int $hocKyId = null): array
    {
        $sinhVien = $user->sinhVien;
        if ($sinhVien === null) {
            abort(404, 'Không tìm thấy hồ sơ sinh viên.');
        }

        $dangKys = DangKyHocPhan::query()
            ->where('sinh_vien_id', $sinhVien->id)
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->when($hocKyId, fn ($q) => $q->whereHas('lopHocPhan', fn ($lop) => $lop->where('hoc_ky_id', $hocKyId)))
            ->with([
                'lopHocPhan.monHoc',
                'lopHocPhan.hocKy',
                'lopHocPhan.giangVien',
                'lopHocPhan.buoiHoc',
            ])
            ->get();

        $danhSach = [];

        foreach ($dangKys as $dangKy) {
            $lop = $dangKy->lopHocPhan;

            // BR-27: Chuyên cần chỉ tính buổi có ngay_hoc >= dang_ky_luc
            $buoiHocs = $lop->buoiHoc->filter(function (BuoiHoc $b) use ($dangKy) {
                if ($dangKy->dang_ky_luc === null) {
                    return true;
                }

                return $b->ngay_hoc->gte($dangKy->dang_ky_luc->startOfDay());
            });

            $diemDanhRecords = DiemDanh::query()
                ->where('dang_ky_hoc_phan_id', $dangKy->id)
                ->whereIn('buoi_hoc_id', $buoiHocs->pluck('id'))
                ->get();

            $coMat = $diemDanhRecords->where('trang_thai', DiemDanh::PRESENT)->count();
            $diMuon = $diemDanhRecords->where('trang_thai', DiemDanh::LATE)->count();
            $vang = $diemDanhRecords->where('trang_thai', DiemDanh::ABSENT)->count();
            $coPhep = $diemDanhRecords->where('trang_thai', DiemDanh::EXCUSED)->count();

            // Công thức FR-11.05: (PRESENT + LATE) / (Tổng buổi đã điểm danh - EXCUSED)
            // tương đương (co_mat + di_muon) / (co_mat + di_muon + vang)
            $mauSo = $coMat + $diMuon + $vang;
            $tyLe = $mauSo === 0 ? null : round(($coMat + $diMuon) / $mauSo, 4);

            $danhSach[] = [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'lop_hoc_phan' => [
                    'id' => $lop->id,
                    'ma_lop_hp' => $lop->ma_lop_hp,
                    'ten_mon' => $lop->monHoc?->ten_mon,
                    'ma_mon' => $lop->monHoc?->ma_mon,
                    'so_tin_chi' => $lop->monHoc?->so_tin_chi,
                    'hoc_ky' => $lop->hocKy ? [
                        'id' => $lop->hocKy->id,
                        'ma_hoc_ky' => $lop->hocKy->ma_hoc_ky,
                        'ten_hoc_ky' => $lop->hocKy->ten_hoc_ky,
                    ] : null,
                    'giang_vien' => $lop->giangVien?->ho_ten,
                ],
                'tong_so_buoi' => $buoiHocs->count(),
                'so_buoi_da_hoc' => $buoiHocs->where('trang_thai', BuoiHoc::DONE)->count(),
                'co_mat' => $coMat,
                'di_muon' => $diMuon,
                'vang' => $vang,
                'co_phep' => $coPhep,
                'ty_le' => $tyLe,
            ];
        }

        return $danhSach;
    }

    private function kiemTraCoTheSua(BuoiHoc $buoiHoc, User $user): bool
    {
        if ($user->laAdmin()) {
            return true;
        }

        if ($buoiHoc->lopHocPhan->hocKy?->trang_thai === HocKy::CLOSED) {
            return false;
        }

        $soNgay = (int) CauHinh::lay('diem.diem_danh.sua_trong_so_ngay', 7);
        $thoiDiemKetThuc = Carbon::parse($buoiHoc->ngay_hoc->toDateString().' '.$buoiHoc->gio_ket_thuc);

        return now()->lte($thoiDiemKetThuc->copy()->addDays($soNgay));
    }
}
