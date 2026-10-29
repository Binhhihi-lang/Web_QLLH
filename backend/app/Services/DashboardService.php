<?php

namespace App\Services;

use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use Illuminate\Support\Facades\DB;

class DashboardService
{
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
                'nam_thu' => $lop->nam_thu,
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
}

