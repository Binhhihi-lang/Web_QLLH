<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\QuyDoiDiem;
use App\Models\SinhVien;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DashboardService
{
    /** Số ngày mặc định còn được sửa điểm danh (04-api-contract.md §14). */
    private const SO_NGAY_SUA_MAC_DINH = 7;

    /** Cửa sổ "buổi học sắp tới" của dashboard giảng viên, tính bằng ngày. */
    private const CUA_SO_SAP_TOI_NGAY = 14;

    /** Giới hạn số dòng của hai danh sách buổi học trong dashboard giảng viên. */
    private const SO_BUOI_TOI_DA = 20;

    /** Giới hạn số buổi của thời khoá biểu tuần trong dashboard sinh viên. */
    private const SO_BUOI_TUAN_TOI_DA = 50;

    public function __construct(private readonly QuanLyDiemService $diemService) {}

    /**
     * Dữ liệu thống kê tổng quan cho ADMIN (SCR-03).
     */
    public function layThongKeAdmin(): array
    {
        $tongSinhVien = SinhVien::query()->count();
        $sinhVienHoatDong = SinhVien::query()->where('trang_thai', true)->count();

        $lopDangMo = LopHocPhan::query()->where('trang_thai', LopHocPhan::OPEN)->count();

        $tongDangKy = DangKyHocPhan::query()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->count();

        // Tính tổng chỗ và số chỗ còn trống của các lớp đang mở
        $thongKeCho = LopHocPhan::query()
            ->where('trang_thai', LopHocPhan::OPEN)
            ->withCount(['dangKyHocPhan as so_luong_dang_ky' => function ($query) {
                $query->where('trang_thai', DangKyHocPhan::ACTIVE);
            }])
            ->get();

        $tongSucChua = $thongKeCho->sum('si_so_toi_da');
        $tongDaDangKy = $thongKeCho->sum('so_luong_dang_ky');
        $choConTrong = max(0, $tongSucChua - $tongDaDangKy);

        $lopDaySiSo = $thongKeCho->filter(fn ($lop) => $lop->so_luong_dang_ky >= $lop->si_so_toi_da)->count();

        $trungBinhDangKy = $tongSinhVien > 0 ? round($tongDangKy / $tongSinhVien, 1) : 0;
        $tiLeTrong = $tongSucChua > 0 ? round(($choConTrong / $tongSucChua) * 100, 1) : 0;

        $theSoLieu = [
            [
                'khoa' => 'sinh_vien',
                'label' => 'Tổng sinh viên',
                'gia_tri' => $tongSinhVien,
                'don_vi' => null,
                'phu_chu' => "{$sinhVienHoatDong} sinh viên đang hoạt động",
                'xu_huong' => 'len',
            ],
            [
                'khoa' => 'lop_hoc_phan',
                'label' => 'Lớp học phần đang mở',
                'gia_tri' => $lopDangMo,
                'don_vi' => null,
                'phu_chu' => "{$lopDaySiSo} lớp đã đầy sĩ số",
                'xu_huong' => 'len',
            ],
            [
                'khoa' => 'dang_ky',
                'label' => 'Lượt đăng ký học phần',
                'gia_tri' => $tongDangKy,
                'don_vi' => null,
                'phu_chu' => "Trung bình {$trungBinhDangKy} lớp mỗi sinh viên",
                'xu_huong' => 'len',
            ],
            [
                'khoa' => 'cho_dang_ky',
                'label' => 'Chỗ còn trống',
                'gia_tri' => $choConTrong,
                'don_vi' => 'chỗ',
                'phu_chu' => "Chiếm {$tiLeTrong}% tổng sức chứa",
                'xu_huong' => 'xuong',
            ],
        ];

        // 4 học kỳ gần nhất
        $hocKies = HocKy::query()
            ->orderByDesc('id')
            ->take(4)
            ->get()
            ->reverse()
            ->values();

        $tyLeLapDay = [];
        foreach ($hocKies as $hk) {
            $lops = LopHocPhan::query()
                ->where('hoc_ky_id', $hk->id)
                ->withCount(['dangKyHocPhan as so_dang_ky' => function ($q) {
                    $q->where('trang_thai', DangKyHocPhan::ACTIVE);
                }])
                ->get();

            $tongChoHk = (int) $lops->sum('si_so_toi_da');
            $daDangKyHk = (int) $lops->sum('so_dang_ky');

            $tyLeLapDay[] = [
                'hoc_ky' => $hk->ten_hoc_ky,
                'tong_cho' => $tongChoHk,
                'da_dang_ky' => $daDangKyHk,
            ];
        }

        // Lớp sắp mở / đang mở
        $cacLopSapMo = LopHocPhan::query()
            ->with(['monHoc', 'giangVien'])
            ->withCount(['dangKyHocPhan as si_so_thuc_te' => function ($q) {
                $q->where('trang_thai', DangKyHocPhan::ACTIVE);
            }])
            ->whereIn('trang_thai', [LopHocPhan::OPEN, LopHocPhan::CLOSED])
            ->latest('id')
            ->take(5)
            ->get();

        $lopSapMo = $cacLopSapMo->map(function ($lop) {
            $siSoToiDa = max(1, (int) $lop->si_so_toi_da);
            $siSo = (int) $lop->si_so_thuc_te;
            $tyLe = min(100, (int) round(($siSo / $siSoToiDa) * 100));

            return [
                'id' => $lop->id,
                'ma_lop_hp' => $lop->ma_lop_hp,
                'ten_mon_hoc' => $lop->monHoc?->ten_mon ?? '',
                'ten_giang_vien' => $lop->giangVien?->ho_ten ?? '',
                'si_so' => "{$siSo}/{$lop->si_so_toi_da}",
                'ty_le' => $tyLe,
                'trang_thai' => $lop->trang_thai,
            ];
        })->values()->all();

        // Đăng ký gần đây
        $cacDangKy = DangKyHocPhan::query()
            ->with(['sinhVien', 'lopHocPhan.monHoc'])
            ->latest('id')
            ->take(5)
            ->get();

        $dangKyGanDay = $cacDangKy->map(function ($dk) {
            $thoiGian = $dk->dang_ky_luc ?? $dk->created_at;

            return [
                'id' => $dk->id,
                'ma_sv' => $dk->sinhVien?->ma_sv ?? '',
                'ho_ten' => $dk->sinhVien?->ho_ten ?? '',
                'ma_lop_hp' => $dk->lopHocPhan?->ma_lop_hp ?? '',
                'ten_mon_hoc' => $dk->lopHocPhan?->monHoc?->ten_mon ?? '',
                'thoi_gian' => $thoiGian ? $thoiGian->format('Y-m-d H:i:s') : '',
                'trang_thai' => $dk->trang_thai === DangKyHocPhan::ACTIVE ? 'THANH_CONG' : 'DA_HUY',
            ];
        })->values()->all();

        return [
            'the_so_lieu' => $theSoLieu,
            'ty_le_lap_day' => $tyLeLapDay,
            'lop_sap_mo' => $lopSapMo,
            'dang_ky_gan_day' => $dangKyGanDay,
        ];
    }

    /**
     * Dashboard GIANG_VIEN (SCR-04, FR-13.02) — docs/04-api-contract.md §14.
     *
     * Ngân sách: 8 truy vấn khi có dữ liệu (xem bảng "Nguồn số liệu TEACHER").
     * Mọi số liệu chỉ tính trong học kỳ đã chọn; không truy vấn trong vòng lặp.
     */
    public function layThongKeGiangVien(User $user, ?int $hocKyId = null): array
    {
        $giangVien = $user->giangVien;

        if ($giangVien === null) {
            throw new LoiNghiepVu('FORBIDDEN', 'Không tìm thấy hồ sơ giảng viên.', 403);
        }

        $hocKy = $this->chonHocKyCuaGiangVien($giangVien->id, $hocKyId);

        if ($hocKy === null) {
            return $this->dashboardGiangVienRong();
        }

        // 1 truy vấn: lớp + môn (join) + sĩ số ACTIVE (withCount).
        $dsLop = LopHocPhan::query()
            ->where('lop_hoc_phan.giang_vien_id', $giangVien->id)
            ->where('lop_hoc_phan.hoc_ky_id', $hocKy->id)
            ->join('mon_hoc', 'mon_hoc.id', '=', 'lop_hoc_phan.mon_hoc_id')
            ->select([
                'lop_hoc_phan.id',
                'lop_hoc_phan.ma_lop_hp',
                'lop_hoc_phan.si_so_toi_da',
                'lop_hoc_phan.trang_thai',
                'lop_hoc_phan.chot_diem_luc',
                'mon_hoc.ma_mon',
                'mon_hoc.ten_mon',
                'mon_hoc.so_tin_chi',
            ])
            ->withCount(['dangKyHocPhan as so_dang_ky' => function ($query) {
                $query->where('trang_thai', DangKyHocPhan::ACTIVE);
            }])
            ->orderBy('mon_hoc.ma_mon')
            ->orderBy('lop_hoc_phan.ma_lop_hp')
            ->get();

        $lopTheoId = $dsLop->keyBy('id');
        $lopIds = $dsLop->pluck('id')->all();

        // 1 truy vấn gộp: trung bình `diem_tong_ket` của mọi đăng ký ACTIVE, theo
        // lop_hoc_phan_id. Dùng CHUNG `QuanLyDiemService::diemTrungBinhLop()` với
        // `/api/me/grades` (§14c) để hai màn không lệch công thức; không N+1 theo lớp.
        $diemTbLop = $this->diemService->diemTrungBinhLop($lopIds);

        $lopPhuTrach = $dsLop->map(function (LopHocPhan $lop) use ($diemTbLop) {
            $siSoToiDa = max(1, (int) $lop->si_so_toi_da);
            $siSo = (int) $lop->so_dang_ky;

            return [
                'id' => $lop->id,
                'ma_lop_hp' => $lop->ma_lop_hp,
                'ma_mon' => $lop->ma_mon,
                'ten_mon' => $lop->ten_mon,
                'so_tin_chi' => (int) $lop->so_tin_chi,
                'si_so' => "{$siSo}/{$lop->si_so_toi_da}",
                'ty_le' => min(100, (int) round(($siSo / $siSoToiDa) * 100)),
                'trang_thai' => $lop->trang_thai,
                'da_chot_diem' => $lop->chot_diem_luc !== null,
                // `null` = chưa ai được chấm điểm (không phải 0) — §14.
                'diem_tb_lop' => $diemTbLop[$lop->id] ?? null,
            ];
        })->values()->all();

        $soLopChuaChot = $dsLop->whereNull('chot_diem_luc')->count();
        $tongSinhVien = (int) $dsLop->sum('so_dang_ky');
        $lopDongNhat = (int) $dsLop->max('so_dang_ky');

        $bayGio = now();
        $homNay = $bayGio->toDateString();
        $gioHienTai = $bayGio->format('H:i:s');
        $hanSapToi = $bayGio->copy()->addDays(self::CUA_SO_SAP_TOI_NGAY)->toDateString();

        // 1 truy vấn: buổi SCHEDULED sắp tới trong 14 ngày, kèm phòng (join).
        $dsBuoiSapToi = $this->truyVanBuoiChuaKetThuc($lopIds, $hanSapToi, $homNay, $gioHienTai)
            ->orderBy('buoi_hoc.ngay_hoc')
            ->orderBy('buoi_hoc.gio_bat_dau')
            ->limit(self::SO_BUOI_TOI_DA)
            ->get();

        // 1 truy vấn: buổi SCHEDULED đã kết thúc mà chưa có bản ghi điểm danh nào.
        $dsBuoiChuaDiemDanh = BuoiHoc::query()
            ->whereIn('buoi_hoc.lop_hoc_phan_id', $lopIds)
            ->where('buoi_hoc.trang_thai', BuoiHoc::SCHEDULED)
            ->where(function ($query) use ($homNay, $gioHienTai) {
                $query->whereDate('buoi_hoc.ngay_hoc', '<', $homNay)
                    ->orWhere(function ($trongNgay) use ($homNay, $gioHienTai) {
                        $trongNgay->whereDate('buoi_hoc.ngay_hoc', $homNay)
                            ->where('buoi_hoc.gio_ket_thuc', '<', $gioHienTai);
                    });
            })
            ->whereDoesntHave('diemDanh')
            ->select([
                'buoi_hoc.id',
                'buoi_hoc.lop_hoc_phan_id',
                'buoi_hoc.ngay_hoc',
                'buoi_hoc.tiet_bat_dau',
                'buoi_hoc.tiet_ket_thuc',
                'buoi_hoc.gio_ket_thuc',
            ])
            ->orderBy('buoi_hoc.ngay_hoc')
            ->limit(self::SO_BUOI_TOI_DA)
            ->get();

        // Cấu hình số ngày sửa điểm danh: đọc một lần cho cả response, và chỉ khi cần.
        $soNgaySua = $dsBuoiChuaDiemDanh->isEmpty() ? null : $this->soNgaySuaDiemDanh($hocKy);

        $buoiSapToi = $dsBuoiSapToi->map(function (BuoiHoc $buoi) use ($lopTheoId) {
            $lop = $lopTheoId->get($buoi->lop_hoc_phan_id);

            return [
                'id' => $buoi->id,
                'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
                'thu' => $this->thuTrongTuan($buoi->ngay_hoc),
                'tiet_bat_dau' => $buoi->tiet_bat_dau,
                'tiet_ket_thuc' => $buoi->tiet_ket_thuc,
                'gio_bat_dau' => substr((string) $buoi->gio_bat_dau, 0, 5),
                'gio_ket_thuc' => substr((string) $buoi->gio_ket_thuc, 0, 5),
                'hinh_thuc' => $buoi->hinh_thuc,
                'trang_thai' => $buoi->trang_thai,
                'ma_lop_hp' => $lop?->ma_lop_hp ?? '',
                'ma_mon' => $lop?->ma_mon ?? '',
                'ten_mon' => $lop?->ten_mon ?? '',
                'phong_hoc' => $buoi->phong_id !== null ? [
                    'id' => (int) $buoi->phong_id,
                    'ma_phong' => $buoi->ma_phong,
                    'ten_phong' => $buoi->ten_phong,
                ] : null,
            ];
        })->values()->all();

        $buoiChuaDiemDanh = $dsBuoiChuaDiemDanh->map(function (BuoiHoc $buoi) use ($lopTheoId, $hocKy, $soNgaySua, $bayGio) {
            $lop = $lopTheoId->get($buoi->lop_hoc_phan_id);
            $ketThuc = Carbon::parse($buoi->ngay_hoc->toDateString().' '.$buoi->gio_ket_thuc);
            $giayTre = max(0, $bayGio->getTimestamp() - $ketThuc->getTimestamp());

            return [
                'id' => $buoi->id,
                'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
                'thu' => $this->thuTrongTuan($buoi->ngay_hoc),
                'tiet_bat_dau' => $buoi->tiet_bat_dau,
                'tiet_ket_thuc' => $buoi->tiet_ket_thuc,
                'gio_ket_thuc' => substr((string) $buoi->gio_ket_thuc, 0, 5),
                'ma_lop_hp' => $lop?->ma_lop_hp ?? '',
                'ma_mon' => $lop?->ma_mon ?? '',
                'ten_mon' => $lop?->ten_mon ?? '',
                'si_so_lop' => (int) ($lop?->so_dang_ky ?? 0),
                'so_ngay_tre' => intdiv($giayTre, 86400),
                'con_sua_duoc' => $hocKy->trang_thai !== HocKy::CLOSED
                    && $bayGio->lte($ketThuc->copy()->addDays($soNgaySua ?? self::SO_NGAY_SUA_MAC_DINH)),
            ];
        })->values()->all();

        $soQuaHan = collect($buoiChuaDiemDanh)->where('con_sua_duoc', false)->count();

        $theSoLieu = [
            [
                'khoa' => 'lop_phu_trach',
                'label' => 'Lớp phụ trách',
                'gia_tri' => count($lopPhuTrach),
                'don_vi' => null,
                'phu_chu' => "{$soLopChuaChot} lớp chưa chốt điểm",
                'xu_huong' => 'bang',
            ],
            [
                'khoa' => 'sinh_vien_phu_trach',
                'label' => 'Sinh viên phụ trách',
                'gia_tri' => $tongSinhVien,
                'don_vi' => null,
                'phu_chu' => "Lớp đông nhất {$lopDongNhat} sinh viên",
                'xu_huong' => 'bang',
            ],
            [
                'khoa' => 'buoi_sap_toi',
                'label' => 'Buổi học sắp tới',
                'gia_tri' => count($buoiSapToi),
                'don_vi' => 'buổi',
                'phu_chu' => 'Trong 14 ngày tới',
                'xu_huong' => 'bang',
            ],
            [
                'khoa' => 'buoi_chua_diem_danh',
                'label' => 'Buổi chưa điểm danh',
                'gia_tri' => count($buoiChuaDiemDanh),
                'don_vi' => 'buổi',
                'phu_chu' => "{$soQuaHan} buổi đã quá hạn sửa",
                'xu_huong' => 'bang',
            ],
        ];

        return [
            'hoc_ky' => $this->tomTatHocKy($hocKy),
            'the_so_lieu' => $theSoLieu,
            'lop_phu_trach' => $lopPhuTrach,
            'buoi_sap_toi' => $buoiSapToi,
            'buoi_chua_diem_danh' => $buoiChuaDiemDanh,
            'viec_can_lam' => $this->viecCanLamCuaGiangVien(
                $hocKy,
                $dsLop,
                $buoiSapToi,
                count($buoiChuaDiemDanh),
                $soQuaHan,
            ),
        ];
    }

    /**
     * Dashboard SINH_VIEN (SCR-05, FR-13.03) — docs/04-api-contract.md §14.
     *
     * `gpa` dùng lại nguyên `QuanLyDiemService::gpaCuaToi()` để hai màn không lệch số.
     */
    public function layThongKeSinhVien(User $user, ?int $hocKyId = null): array
    {
        $sinhVien = $user->sinhVien;

        if ($sinhVien === null) {
            throw new LoiNghiepVu('FORBIDDEN', 'Không tìm thấy hồ sơ sinh viên.', 403);
        }

        // 1. Xác định học kỳ (rẻ: 1 truy vấn), TRƯỚC khi tính GPA. Gọi
        //    `gpaCuaToi()` ở bước này sẽ tính cả CPA tích lũy rồi bị ghi đè ở
        //    dưới — đốt 6 truy vấn cho một con số không ai dùng.
        $hocKy = $hocKyId !== null
            ? $this->timHocKyHoac404($hocKyId)
            : $this->chonHocKyMacDinhCuaSinhVien($sinhVien->id);

        if ($hocKy === null) {
            return $this->dashboardSinhVienRong($this->diemService->gpaCuaToi($user));
        }

        // 2. Đăng ký của kỳ: MỘT collection dùng cho cả khối học phần, điểm
        //    danh và GPA. Không truyền xuống thì mỗi hàm tự query lại.
        $dangKys = $this->layDangKyCuaKy($sinhVien->id, $hocKy->id);

        $gpa = $this->diemService->gpaCuaToi($user, null, $dangKys, $hocKy);

        $lopIds = $dangKys->pluck('lopHocPhan')->filter()->pluck('id')->unique()->values()->all();

        $hocPhanDaDangKy = [];
        foreach ($dangKys as $dangKy) {
            $lop = $dangKy->lopHocPhan;

            // Dashboard sinh viên chỉ cần mã + tên + số tín chỉ (bảng hai cột).
            // Chuyên cần, điểm, giảng viên đã bỏ khỏi dashboard — màn Điểm và
            // Điểm danh riêng đã có. Xem docs/11 V4.
            $hocPhanDaDangKy[] = [
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'lop_hoc_phan_id' => $lop?->id,
                'ma_lop_hp' => $lop?->ma_lop_hp ?? '',
                'ma_mon' => $lop?->monHoc?->ma_mon ?? '',
                'ten_mon' => $lop?->monHoc?->ten_mon ?? '',
                'so_tin_chi' => (int) ($lop?->monHoc?->so_tin_chi ?? 0),
            ];
        }

        $tuNgay = now()->startOfWeek(CarbonInterface::MONDAY)->startOfDay();
        $denNgay = $tuNgay->copy()->addDays(6);

        $cacBuoi = empty($lopIds) ? [] : $this->truyVanBuoiTrongTuan($lopIds, $tuNgay->toDateString(), $denNgay->toDateString())
            ->get()
            ->map(fn (BuoiHoc $buoi) => $this->dinhDangBuoiTrongTuan($buoi, $dangKys))
            ->values()
            ->all();

        $soHocPhan = count($hocPhanDaDangKy);
        $tongTinChi = (int) array_sum(array_column($hocPhanDaDangKy, 'so_tin_chi'));
        $tichLuy = $gpa['tich_luy'];

        $theSoLieu = [
            [
                'khoa' => 'hoc_phan',
                'label' => 'Học phần đã đăng ký',
                'gia_tri' => $soHocPhan,
                'don_vi' => 'học phần',
                'phu_chu' => 'Học kỳ '.$hocKy->ma_hoc_ky,
                'xu_huong' => 'bang',
            ],
            [
                'khoa' => 'tin_chi',
                'label' => 'Tín chỉ trong kỳ',
                'gia_tri' => $tongTinChi,
                'don_vi' => 'tín chỉ',
                'phu_chu' => "Trong {$soHocPhan} học phần",
                'xu_huong' => 'bang',
            ],
            [
                'khoa' => 'gpa_he_4',
                'label' => 'GPA tích lũy',
                'gia_tri' => (float) $tichLuy['gpa_he_4'],
                'don_vi' => 'hệ 4',
                'phu_chu' => "{$tichLuy['so_hoc_ky_da_tinh']} học kỳ đã đóng, {$tichLuy['tong_tin_chi']} tín chỉ",
                'xu_huong' => 'bang',
            ],
            [
                // Thay thẻ "Tỷ lệ chuyên cần" cũ: con số đó chính là điểm danh,
                // trùng tên với `diem_chuyen_can` (thành phần điểm 10%) nên gây
                // nhầm. Số buổi trong tuần lấy từ dữ liệu đã nạp, không thêm query.
                'khoa' => 'buoi_tuan',
                'label' => 'Buổi học tuần này',
                'gia_tri' => count($cacBuoi),
                'don_vi' => 'buổi',
                'phu_chu' => $this->phuChuBuoiTuan($cacBuoi),
                'xu_huong' => 'bang',
            ],
        ];

        return [
            'hoc_ky' => $this->tomTatHocKy($hocKy),
            'the_so_lieu' => $theSoLieu,
            'hoc_phan_da_dang_ky' => $hocPhanDaDangKy,
            'thoi_khoa_bieu_tuan' => [
                'tu_ngay' => $tuNgay->toDateString(),
                'den_ngay' => $denNgay->toDateString(),
                'cac_buoi' => $cacBuoi,
            ],
            'gpa' => $gpa,
        ];
    }

    /**
     * Chọn học kỳ cho dashboard GIANG_VIEN theo bảng §14a:
     * kỳ ONGOING có lớp → kỳ có ngày bắt đầu lớn nhất có lớp → null.
     */
    private function chonHocKyCuaGiangVien(int $giangVienId, ?int $hocKyId): ?HocKy
    {
        if ($hocKyId !== null) {
            return $this->timHocKyHoac404($hocKyId);
        }

        return HocKy::query()
            ->whereHas('lopHocPhan', fn ($query) => $query->where('giang_vien_id', $giangVienId))
            ->orderByRaw('CASE WHEN hoc_ky.trang_thai = ? THEN 0 ELSE 1 END', [HocKy::ONGOING])
            ->orderByDesc('hoc_ky.ngay_bat_dau')
            ->orderByDesc('hoc_ky.id')
            ->first();
    }

    /**
     * Chọn học kỳ cho dashboard SINH_VIEN — đúng bằng `hoc_ky_hien_tai` của
     * `GET /api/me/gpa` khi không truyền tham số, để hai màn không lệch nhau.
     *
     * @param  array<string, mixed>  $gpa
     */
    private function chonHocKyCuaSinhVien(array $gpa, ?int $hocKyId): ?HocKy
    {
        if ($hocKyId !== null) {
            return $this->timHocKyHoac404($hocKyId);
        }

        $hocKyHienTai = $gpa['hoc_ky_hien_tai'] ?? null;

        if ($hocKyHienTai === null) {
            return null;
        }

        // Dựng đối tượng từ chính dữ liệu GPA đã có thay vì `find()`: cùng một
        // học kỳ, không cần thêm một truy vấn chỉ để lấy lần nữa.
        $hocKy = new HocKy;
        $hocKy->id = $hocKyHienTai['id'];
        $hocKy->ma_hoc_ky = $hocKyHienTai['ma_hoc_ky'];
        $hocKy->ten_hoc_ky = $hocKyHienTai['ten_hoc_ky'];
        $hocKy->trang_thai = $hocKyHienTai['trang_thai'] ?? HocKy::ONGOING;

        return $hocKy;
    }

    /**
     * Đăng ký ACTIVE của một sinh viên trong một kỳ, kèm môn/giảng viên/điểm.
     *
     * Dùng chung cho dashboard và `diemCuaToi()` để cả hai đọc CÙNG một
     * collection — thay vì mỗi bên query riêng rồi ra hai bộ số khác nhau.
     */
    private function layDangKyCuaKy(int $sinhVienId, int $hocKyId): Collection
    {
        return DangKyHocPhan::query()
            ->where('dang_ky_hoc_phan.sinh_vien_id', $sinhVienId)
            ->where('dang_ky_hoc_phan.trang_thai', DangKyHocPhan::ACTIVE)
            ->whereHas('lopHocPhan', fn ($query) => $query->where('hoc_ky_id', $hocKyId))
            ->with(['lopHocPhan.monHoc', 'lopHocPhan.giangVien', 'diem'])
            ->orderBy('dang_ky_hoc_phan.id')
            ->get();
    }

    /**
     * Kỳ mặc định của sinh viên: kỳ ONGOING có đăng ký → kỳ có ngày bắt đầu
     * lớn nhất có đăng ký → null. Một truy vấn, không cần dựng GPA trước.
     */
    private function chonHocKyMacDinhCuaSinhVien(int $sinhVienId): ?HocKy
    {
        $coDangKy = fn ($query) => $query
            ->where('sinh_vien_id', $sinhVienId)
            ->where('trang_thai', DangKyHocPhan::ACTIVE);

        return HocKy::query()
            ->where('trang_thai', HocKy::ONGOING)
            ->whereHas('lopHocPhan.dangKyHocPhan', $coDangKy)
            ->orderByDesc('ngay_bat_dau')
            ->first()
            ?? HocKy::query()
                ->whereHas('lopHocPhan.dangKyHocPhan', $coDangKy)
                ->orderByDesc('ngay_bat_dau')
                ->first();
    }

    private function timHocKyHoac404(int $hocKyId): HocKy
    {
        $hocKy = HocKy::query()->find($hocKyId);

        if ($hocKy === null) {
            throw new LoiNghiepVu('SEMESTER_NOT_FOUND', 'Không tìm thấy học kỳ yêu cầu.', 404);
        }

        return $hocKy;
    }

    /**
     * @return array{id: int, ma_hoc_ky: string, ten_hoc_ky: string, trang_thai: string}
     */
    private function tomTatHocKy(HocKy $hocKy): array
    {
        return [
            'id' => $hocKy->id,
            'ma_hoc_ky' => $hocKy->ma_hoc_ky,
            'ten_hoc_ky' => $hocKy->ten_hoc_ky,
            'trang_thai' => $hocKy->trang_thai,
        ];
    }

    /**
     * Buổi SCHEDULED của các lớp đã cho, chưa kết thúc, không muộn hơn hạn —
     * kèm phòng học bằng join để không phát sinh truy vấn eager load.
     *
     * @param  array<int, int>  $lopIds
     */
    private function truyVanBuoiChuaKetThuc(array $lopIds, string $hanNgay, string $homNay, string $gioHienTai)
    {
        return BuoiHoc::query()
            ->whereIn('buoi_hoc.lop_hoc_phan_id', $lopIds)
            ->where('buoi_hoc.trang_thai', BuoiHoc::SCHEDULED)
            ->whereDate('buoi_hoc.ngay_hoc', '<=', $hanNgay)
            ->where(function ($query) use ($homNay, $gioHienTai) {
                $query->whereDate('buoi_hoc.ngay_hoc', '>', $homNay)
                    ->orWhere(function ($trongNgay) use ($homNay, $gioHienTai) {
                        $trongNgay->whereDate('buoi_hoc.ngay_hoc', $homNay)
                            ->where('buoi_hoc.gio_ket_thuc', '>', $gioHienTai);
                    });
            })
            ->join('phong_hoc', 'phong_hoc.id', '=', 'buoi_hoc.phong_hoc_id')
            ->select([
                'buoi_hoc.id',
                'buoi_hoc.lop_hoc_phan_id',
                'buoi_hoc.ngay_hoc',
                'buoi_hoc.tiet_bat_dau',
                'buoi_hoc.tiet_ket_thuc',
                'buoi_hoc.gio_bat_dau',
                'buoi_hoc.gio_ket_thuc',
                'buoi_hoc.hinh_thuc',
                'buoi_hoc.trang_thai',
                'phong_hoc.id as phong_id',
                'phong_hoc.ma_phong',
                'phong_hoc.ten_phong',
            ]);
    }

    /**
     * Buổi học trong tuần của các lớp đã cho, kèm phòng học bằng join.
     * Giữ cả buổi CANCELLED để FE gạch chéo (SCR-35).
     *
     * @param  array<int, int>  $lopIds
     */
    private function truyVanBuoiTrongTuan(array $lopIds, string $tuNgay, string $denNgay)
    {
        return BuoiHoc::query()
            ->whereIn('buoi_hoc.lop_hoc_phan_id', $lopIds)
            ->whereDate('buoi_hoc.ngay_hoc', '>=', $tuNgay)
            ->whereDate('buoi_hoc.ngay_hoc', '<=', $denNgay)
            ->join('phong_hoc', 'phong_hoc.id', '=', 'buoi_hoc.phong_hoc_id')
            ->select([
                'buoi_hoc.id',
                'buoi_hoc.lop_hoc_phan_id',
                'buoi_hoc.ngay_hoc',
                'buoi_hoc.tiet_bat_dau',
                'buoi_hoc.tiet_ket_thuc',
                'buoi_hoc.gio_bat_dau',
                'buoi_hoc.gio_ket_thuc',
                'buoi_hoc.trang_thai',
                'buoi_hoc.hinh_thuc',
                'buoi_hoc.ly_do_huy',
                'phong_hoc.ma_phong',
                'phong_hoc.ten_phong',
            ])
            ->orderBy('buoi_hoc.ngay_hoc')
            ->orderBy('buoi_hoc.gio_bat_dau')
            ->limit(self::SO_BUOI_TUAN_TOI_DA);
    }

    /**
     * Phụ chú cho thẻ "Buổi học tuần này": nêu hôm nay có buổi hay không.
     *
     * @param  array<int, array<string, mixed>>  $cacBuoi
     */
    private function phuChuBuoiTuan(array $cacBuoi): string
    {
        if ($cacBuoi === []) {
            return 'Tuần này không có buổi';
        }

        $homNay = now()->toDateString();
        $soHomNay = count(array_filter($cacBuoi, fn ($buoi) => ($buoi['ngay_hoc'] ?? null) === $homNay));

        return $soHomNay > 0
            ? "{$soHomNay} buổi hôm nay"
            : 'Hôm nay không có buổi';
    }

    /**
     * @param  Collection<int, DangKyHocPhan>  $dangKys
     * @return array<string, mixed>
     */
    private function dinhDangBuoiTrongTuan(BuoiHoc $buoi, Collection $dangKys): array
    {
        $dangKy = $dangKys->firstWhere('lop_hoc_phan_id', $buoi->lop_hoc_phan_id);
        $lop = $dangKy?->lopHocPhan;

        return [
            'id' => $buoi->id,
            'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
            'thu' => $this->thuTrongTuan($buoi->ngay_hoc),
            'tiet_bat_dau' => $buoi->tiet_bat_dau,
            'tiet_ket_thuc' => $buoi->tiet_ket_thuc,
            'gio_bat_dau' => substr((string) $buoi->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr((string) $buoi->gio_ket_thuc, 0, 5),
            'trang_thai' => $buoi->trang_thai,
            'hinh_thuc' => $buoi->hinh_thuc,
            'ly_do_huy' => $buoi->ly_do_huy,
            'ma_lop_hp' => $lop?->ma_lop_hp ?? '',
            'ma_mon' => $lop?->monHoc?->ma_mon ?? '',
            'ten_mon' => $lop?->monHoc?->ten_mon ?? '',
            'ma_phong' => $buoi->ma_phong,
            'ten_phong' => $buoi->ten_phong,
        ];
    }

    /**
     * Danh sách việc cần làm của giảng viên — chỉ giữ mục `so_luong > 0`,
     * sắp theo `muc_do` giảm dần (cao → trung_binh → thap).
     *
     * @param  Collection<int, LopHocPhan>  $dsLop
     * @param  array<int, array<string, mixed>>  $buoiSapToi
     * @return array<int, array<string, mixed>>
     */
    private function viecCanLamCuaGiangVien(
        HocKy $hocKy,
        Collection $dsLop,
        array $buoiSapToi,
        int $soBuoiChuaDiemDanh,
        int $soBuoiQuaHan,
    ): array {
        $viec = [];

        if ($soBuoiChuaDiemDanh > 0) {
            $viec[] = [
                'loai' => 'cham_diem_danh',
                'tieu_de' => 'Điểm danh buổi đã qua',
                'mo_ta' => "{$soBuoiChuaDiemDanh} buổi đã qua chưa điểm danh, trong đó {$soBuoiQuaHan} buổi đã quá hạn sửa.",
                'so_luong' => $soBuoiChuaDiemDanh,
                'muc_do' => $soBuoiQuaHan > 0 ? 'cao' : 'trung_binh',
                'url' => '/diem-danh',
            ];
        }

        // Chỉ kỳ ONGOING mới xét chốt điểm (§14, bảng Nguồn số liệu TEACHER).
        if ($hocKy->trang_thai === HocKy::ONGOING && $dsLop->isNotEmpty()) {
            $lopCoBuoiDone = BuoiHoc::query()
                ->whereIn('lop_hoc_phan_id', $dsLop->pluck('id')->all())
                ->where('trang_thai', BuoiHoc::DONE)
                ->groupBy('lop_hoc_phan_id')
                ->pluck('lop_hoc_phan_id')
                ->all();

            $soLopChuaChot = $dsLop
                ->whereNull('chot_diem_luc')
                ->whereIn('id', $lopCoBuoiDone)
                ->count();

            if ($soLopChuaChot > 0) {
                $viec[] = [
                    'loai' => 'chot_diem',
                    'tieu_de' => 'Chốt điểm lớp học phần',
                    'mo_ta' => "{$soLopChuaChot} lớp chưa chốt điểm.",
                    'so_luong' => $soLopChuaChot,
                    'muc_do' => 'trung_binh',
                    'url' => '/lop-hoc-phan',
                ];
            }
        }

        // Suy từ collection đã tải: 24 giờ ⊂ 14 ngày nên không phát sinh truy vấn.
        $bayGio = now();
        $han24Gio = $bayGio->copy()->addDay();

        $soBuoi24Gio = collect($buoiSapToi)->filter(function (array $buoi) use ($bayGio, $han24Gio) {
            $batDau = Carbon::parse($buoi['ngay_hoc'].' '.$buoi['gio_bat_dau'].':00');

            return $batDau->betweenIncluded($bayGio, $han24Gio);
        })->count();

        if ($soBuoi24Gio > 0) {
            $viec[] = [
                'loai' => 'buoi_sap_toi',
                'tieu_de' => 'Buổi học trong 24 giờ tới',
                'mo_ta' => "{$soBuoi24Gio} buổi bắt đầu trong 24 giờ tới.",
                'so_luong' => $soBuoi24Gio,
                'muc_do' => 'thap',
                'url' => '/lich-hoc',
            ];
        }

        return $viec;
    }

    private function soNgaySuaDiemDanh(HocKy $hocKy): int
    {
        $theoKy = QuyDoiDiem::query()
            ->where('hoc_ky_id', $hocKy->id)
            ->value('so_ngay_sua_diem_danh');

        if ($theoKy !== null) {
            return (int) $theoKy;
        }

        return (int) CauHinh::lay('diem.diem_danh.sua_trong_so_ngay', self::SO_NGAY_SUA_MAC_DINH);
    }

    /**
     * Quy ước Việt Nam: 2 = Thứ 2 … 7 = Thứ 7, 8 = Chủ nhật.
     */
    private function thuTrongTuan(CarbonInterface $ngay): int
    {
        $thu = (int) $ngay->dayOfWeek;

        return $thu === CarbonInterface::SUNDAY ? 8 : $thu + 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function dashboardGiangVienRong(): array
    {
        return [
            'hoc_ky' => null,
            'the_so_lieu' => [],
            'lop_phu_trach' => [],
            'buoi_sap_toi' => [],
            'buoi_chua_diem_danh' => [],
            'viec_can_lam' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $gpa
     * @return array<string, mixed>
     */
    private function dashboardSinhVienRong(array $gpa): array
    {
        $tuNgay = now()->startOfWeek(CarbonInterface::MONDAY)->startOfDay();

        return [
            'hoc_ky' => null,
            'the_so_lieu' => [],
            'hoc_phan_da_dang_ky' => [],
            'thoi_khoa_bieu_tuan' => [
                'tu_ngay' => $tuNgay->toDateString(),
                'den_ngay' => $tuNgay->copy()->addDays(6)->toDateString(),
                'cac_buoi' => [],
            ],
            'gpa' => $gpa,
        ];
    }
}
