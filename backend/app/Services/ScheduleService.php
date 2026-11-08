<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\LichThi;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use Illuminate\Support\Facades\Validator;

/**
 * BR-06 / BR-22: lõi kiểm tra lịch dùng chung cho CRUD buổi học của PM.
 * Chỉ đọc dữ liệu. Caller kiểm tra học kỳ/quyền và gọi trong transaction ghi.
 */
class ScheduleService
{
    /**
     * @param  array{ngay_hoc: string, gio_bat_dau: string, gio_ket_thuc: string, phong_hoc_id: int}  $duLieu
     * @return list<array<string, mixed>>
     */
    public function timTrungLich(
        LopHocPhan $lop,
        array $duLieu,
        ?int $boQuaBuoiId = null,
        ?int $giangVienId = null,
    ): array {
        return $this->timTrungLichCacBuoi($lop, [$this->chuanHoaBuoi($duLieu)], $boQuaBuoiId, $giangVienId);
    }

    private function timTrungLichCacBuoi(
        LopHocPhan $lop,
        array $cacBuoiMoi,
        ?int $boQuaBuoiId = null,
        ?int $giangVienId = null,
    ): array {
        $giangVienId ??= $lop->giang_vien_id;
        $sinhVienIds = $lop->dangKyHocPhan()->dangHieuLuc()->whereHas('sinhVien')->pluck('sinh_vien_id');
        $theoNgay = collect($cacBuoiMoi)->groupBy('ngay_hoc');

        $cacBuoi = BuoiHoc::query()
            ->where('trang_thai', BuoiHoc::SCHEDULED)
            ->whereDate('ngay_hoc', '>=', min(array_column($cacBuoiMoi, 'ngay_hoc')))
            ->whereDate('ngay_hoc', '<=', max(array_column($cacBuoiMoi, 'ngay_hoc')))
            ->whereTime('gio_bat_dau', '<', max(array_column($cacBuoiMoi, 'gio_ket_thuc')))
            ->whereTime('gio_ket_thuc', '>', min(array_column($cacBuoiMoi, 'gio_bat_dau')))
            ->whereHas('lopHocPhan', fn ($query) => $query->where('trang_thai', '!=', LopHocPhan::CANCELLED))
            // Không thể bỏ qua một buổi của lớp khác bằng cách truyền ID của nó.
            ->when($boQuaBuoiId !== null, fn ($query) => $query->whereNot(
                fn ($query) => $query->whereKey($boQuaBuoiId)->where('lop_hoc_phan_id', $lop->id),
            ))
            ->where(function ($query) use ($cacBuoiMoi, $giangVienId, $sinhVienIds) {
                $query->whereIn('phong_hoc_id', array_unique(array_column($cacBuoiMoi, 'phong_hoc_id')))
                    ->orWhereHas('lopHocPhan', fn ($query) => $query->where('giang_vien_id', $giangVienId));

                if ($sinhVienIds->isNotEmpty()) {
                    $query->orWhereHas('lopHocPhan.dangKyHocPhan', fn ($query) => $query
                        ->dangHieuLuc()->whereIn('sinh_vien_id', $sinhVienIds));
                }
            })
            ->with(['lopHocPhan:id,ma_lop_hp,giang_vien_id', 'phongHoc' => fn ($query) => $query->withTrashed()])
            ->orderBy('id')
            ->get();

        $dangKys = $cacBuoi->isEmpty() || $sinhVienIds->isEmpty()
            ? collect()
            : DangKyHocPhan::query()->dangHieuLuc()
                ->whereIn('lop_hoc_phan_id', $cacBuoi->pluck('lop_hoc_phan_id')->unique())
                ->whereIn('sinh_vien_id', $sinhVienIds)->whereHas('sinhVien')->with('sinhVien:id,ma_sv')->get()
                ->groupBy('lop_hoc_phan_id');

        $giangVien = GiangVien::withTrashed()->find($giangVienId);
        $ketQua = [];

        foreach ($cacBuoi as $buoi) {
            $buoiCungGio = $theoNgay->get($buoi->ngay_hoc->format('Y-m-d'), collect())
                ->filter(fn ($moi) => $this->gio($buoi->gio_bat_dau) < $moi['gio_ket_thuc']
                    && $this->gio($buoi->gio_ket_thuc) > $moi['gio_bat_dau']);

            if ($buoiCungGio->isEmpty()) {
                continue;
            }

            if ($buoiCungGio->contains('phong_hoc_id', $buoi->phong_hoc_id)) {
                $ketQua[] = $this->moTaTrung($buoi, 'phong_hoc', $buoi->phongHoc?->ma_phong ?? (string) $buoi->phong_hoc_id);
            }

            if ($buoi->lopHocPhan->giang_vien_id === $giangVienId) {
                $ketQua[] = $this->moTaTrung($buoi, 'giang_vien', $giangVien?->ma_gv ?? (string) $giangVienId);
            }

            foreach ($dangKys->get($buoi->lop_hoc_phan_id, collect()) as $dangKy) {
                $ketQua[] = [
                    ...$this->moTaTrung($buoi, 'sinh_vien', $dangKy->sinhVien->ma_sv),
                    'sinh_vien_id' => $dangKy->sinh_vien_id,
                ];
            }
        }

        return $ketQua;
    }

    /**
     * Phòng đã có ca thi trong khung giờ này chưa. Trước đây ScheduleService chỉ
     * nhìn bảng buổi học, còn QuanLyLichThiService chỉ nhìn bảng lịch thi, nên
     * hai bên có thể xếp chồng lên nhau mà không ai báo.
     *
     * @param  list<array{ngay_hoc: string, gio_bat_dau: string, gio_ket_thuc: string, phong_hoc_id: int}>  $cacBuoi
     * @return list<array<string, mixed>>
     */
    private function timTrungVoiCaThi(array $cacBuoi): array
    {
        // Gom một truy vấn cho cả lô: 25 buổi mà query từng buổi là N+1, đúng
        // thứ test_kiem_tra_ca_lo_gom_truy_van_khong_lap_theo_so_buoi canh.
        $cacCaThi = LichThi::query()
            ->whereIn('phong_hoc_id', array_unique(array_column($cacBuoi, 'phong_hoc_id')))
            ->whereDate('ngay_thi', '>=', min(array_column($cacBuoi, 'ngay_hoc')))
            ->whereDate('ngay_thi', '<=', max(array_column($cacBuoi, 'ngay_hoc')))
            ->whereTime('gio_bat_dau', '<', max(array_column($cacBuoi, 'gio_ket_thuc')))
            ->whereTime('gio_ket_thuc', '>', min(array_column($cacBuoi, 'gio_bat_dau')))
            ->with('monHoc:id,ma_mon,ten_mon')
            ->get();

        $ketQua = [];

        foreach ($cacBuoi as $buoi) {
            foreach ($cacCaThi as $ca) {
                if ($ca->phong_hoc_id === $buoi['phong_hoc_id']
                    && $ca->ngay_thi->format('Y-m-d') === $buoi['ngay_hoc']
                    && $this->gio($ca->gio_bat_dau) < $this->gio($buoi['gio_ket_thuc'])
                    && $this->gio($ca->gio_ket_thuc) > $this->gio($buoi['gio_bat_dau'])) {
                    $ketQua[] = [
                        'lich_thi_id' => $ca->id,
                        'ngay_hoc' => $ca->ngay_thi->format('Y-m-d'),
                        'gio_bat_dau' => substr($ca->gio_bat_dau, 0, 5),
                        'gio_ket_thuc' => substr($ca->gio_ket_thuc, 0, 5),
                        'loai' => 'lich_thi',
                        'doi_tuong' => $ca->monHoc?->ma_mon,
                    ];
                }
            }
        }

        return $ketQua;
    }

    /** Ném lỗi 409 với errors.trung_lich để các endpoint ghi dùng chung envelope. */
    public function kiemTraTrungLich(
        LopHocPhan $lop,
        array $duLieu,
        ?int $boQuaBuoiId = null,
        ?int $giangVienId = null,
    ): void {
        $this->baoLoiNeuTrung(array_merge(
            $this->timTrungLich($lop, $duLieu, $boQuaBuoiId, $giangVienId),
            $this->timTrungVoiCaThi([$this->chuanHoaBuoi($duLieu)]),
        ));
    }

    /**
     * Kiểm tra cả lô trước khi PM sinh lịch: lịch đã có + xung đột trong chính lô.
     * Không tạo/sửa buổi nào, nên phát hiện lỗi không để lại dữ liệu ghi dở.
     *
     * @param  list<array<string, mixed>>  $cacBuoi
     */
    public function kiemTraDanhSach(LopHocPhan $lop, array $cacBuoi): void
    {
        Validator::make(['buoi_hoc' => $cacBuoi], [
            'buoi_hoc' => ['required', 'array', 'min:1', 'max:500'],
            'buoi_hoc.*' => ['required', 'array'],
        ])->validate();
        $cacBuoi = array_map(fn ($buoi) => $this->chuanHoaBuoi($buoi), $cacBuoi);
        $trungLich = array_merge(
            $this->timTrungLichCacBuoi($lop, $cacBuoi),
            $this->timTrungVoiCaThi($cacBuoi),
        );
        $daKiemTra = [];

        foreach ($cacBuoi as $index => $buoi) {
            foreach ($daKiemTra as $indexCu => $cu) {
                if ($cu['ngay_hoc'] === $buoi['ngay_hoc']
                    && $cu['gio_bat_dau'] < $buoi['gio_ket_thuc']
                    && $cu['gio_ket_thuc'] > $buoi['gio_bat_dau']) {
                    // Hai buổi cùng lớp luôn cùng giảng viên, kể cả khác phòng.
                    $trungLich[] = [
                        'ngay_hoc' => $buoi['ngay_hoc'],
                        'gio_bat_dau' => substr($buoi['gio_bat_dau'], 0, 5),
                        'gio_ket_thuc' => substr($buoi['gio_ket_thuc'], 0, 5),
                        'loai' => 'giang_vien',
                        'doi_tuong' => $lop->giangVien?->ma_gv ?? (string) $lop->giang_vien_id,
                        'dong' => $index,
                        'trung_voi_dong' => $indexCu,
                    ];
                }
            }

            $daKiemTra[] = $buoi;
        }

        $this->baoLoiNeuTrung($trungLich);
    }

    /**
     * Adapter cho EnrollmentService: so lịch SCHEDULED của lớp muốn đăng ký
     * với các lớp sinh viên đang ACTIVE; không xét phòng/GV không liên quan.
     *
     * @return list<array<string, mixed>>
     */
    public function timTrungLichDangKy(SinhVien $sinhVien, LopHocPhan $lop): array
    {
        $buoiMoi = $lop->buoiHoc()->where('trang_thai', BuoiHoc::SCHEDULED)->get();
        if ($buoiMoi->isEmpty()) {
            return [];
        }

        $ngays = $buoiMoi->map(fn ($buoi) => $buoi->ngay_hoc->format('Y-m-d'));
        $buoiDangHoc = BuoiHoc::query()->where('trang_thai', BuoiHoc::SCHEDULED)
            ->whereDate('ngay_hoc', '>=', $ngays->min())
            ->whereDate('ngay_hoc', '<=', $ngays->max())
            ->where('lop_hoc_phan_id', '!=', $lop->id)
            ->whereHas('lopHocPhan', fn ($query) => $query->where('trang_thai', '!=', LopHocPhan::CANCELLED))
            ->whereHas('lopHocPhan.dangKyHocPhan', fn ($query) => $query->dangHieuLuc()->where('sinh_vien_id', $sinhVien->id))
            ->with('lopHocPhan:id,ma_lop_hp')->orderBy('id')->get();

        return $buoiDangHoc->filter(fn ($cu) => $buoiMoi->contains(fn ($moi) => $cu->ngay_hoc->equalTo($moi->ngay_hoc)
            && $this->gio($cu->gio_bat_dau) < $this->gio($moi->gio_ket_thuc)
            && $this->gio($cu->gio_ket_thuc) > $this->gio($moi->gio_bat_dau)))
            ->map(fn ($buoi) => [
                ...$this->moTaTrung($buoi, 'sinh_vien', $sinhVien->ma_sv),
                'sinh_vien_id' => $sinhVien->id,
            ])->values()->all();
    }

    private function chuanHoaBuoi(array $buoi): array
    {
        $duLieu = Validator::make($buoi, [
            'ngay_hoc' => ['required', 'date_format:Y-m-d'],
            'gio_bat_dau' => ['required', 'date_format:H:i,H:i:s'],
            'gio_ket_thuc' => ['required', 'date_format:H:i,H:i:s', 'after:gio_bat_dau'],
            'phong_hoc_id' => ['required', 'integer', 'min:1'],
        ])->validate();

        return [
            ...$duLieu,
            'phong_hoc_id' => (int) $duLieu['phong_hoc_id'],
            'gio_bat_dau' => $this->gio($duLieu['gio_bat_dau']),
            'gio_ket_thuc' => $this->gio($duLieu['gio_ket_thuc']),
        ];
    }

    private function gio(string $gio): string
    {
        return strlen($gio) === 5 ? $gio.':00' : $gio;
    }

    private function moTaTrung(BuoiHoc $buoi, string $loai, string $doiTuong): array
    {
        return [
            'buoi_hoc_id' => $buoi->id,
            'lop_hoc_phan_id' => $buoi->lop_hoc_phan_id,
            'ma_lop_hp' => $buoi->lopHocPhan?->ma_lop_hp,
            'ngay_hoc' => $buoi->ngay_hoc->format('Y-m-d'),
            'gio_bat_dau' => substr($buoi->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($buoi->gio_ket_thuc, 0, 5),
            'loai' => $loai,
            'doi_tuong' => $doiTuong,
        ];
    }

    private function baoLoiNeuTrung(array $trungLich): void
    {
        if ($trungLich !== []) {
            throw new LoiNghiepVu('SCHEDULE_CONFLICT', 'Có buổi học bị trùng lịch.', errors: ['trung_lich' => $trungLich]);
        }
    }
}
