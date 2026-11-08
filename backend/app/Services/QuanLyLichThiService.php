<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\HocKy;
use App\Models\LichThi;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\TietHoc;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Ca thi dùng chung khung tiết với buổi học. Xung đột chỉ xét phòng thi
 * (thi không có đăng ký lớp nên không cần kiểm tra sinh viên/giảng viên).
 */
class QuanLyLichThiService
{
    public function danhSach(array $boLoc)
    {
        $boLoc = Validator::make($boLoc, [
            'hoc_ky_id' => ['sometimes', 'integer'],
            'mon_hoc_id' => ['sometimes', 'integer'],
            'tu_ngay' => ['sometimes', 'date_format:Y-m-d'],
            'den_ngay' => ['sometimes', 'date_format:Y-m-d'],
        ])->validate();

        return LichThi::query()
            ->with(['monHoc:id,ma_mon,ten_mon', 'hocKy:id,ten_hoc_ky', 'phongHoc' => fn ($q) => $q->withTrashed()])
            ->when($boLoc['hoc_ky_id'] ?? null, fn ($q, $id) => $q->where('hoc_ky_id', $id))
            ->when($boLoc['mon_hoc_id'] ?? null, fn ($q, $id) => $q->where('mon_hoc_id', $id))
            ->when($boLoc['tu_ngay'] ?? null, fn ($q, $ngay) => $q->whereDate('ngay_thi', '>=', $ngay))
            ->when($boLoc['den_ngay'] ?? null, fn ($q, $ngay) => $q->whereDate('ngay_thi', '<=', $ngay))
            ->orderBy('ngay_thi')
            ->orderBy('gio_bat_dau')
            ->get();
    }

    /** Ca thi mà sinh viên phải thi: chỉ môn đã đăng ký ACTIVE trong kỳ. */
    public function cuaSinhVien(int $sinhVienId, ?int $hocKyId)
    {
        return LichThi::query()
            ->with(['monHoc:id,ma_mon,ten_mon', 'hocKy:id,ten_hoc_ky', 'phongHoc' => fn ($q) => $q->withTrashed()])
            ->whereIn('mon_hoc_id', function ($truyVan) use ($sinhVienId) {
                $truyVan->select('lhp.mon_hoc_id')
                    ->from('dang_ky_hoc_phan as dk')
                    ->join('lop_hoc_phan as lhp', 'lhp.id', '=', 'dk.lop_hoc_phan_id')
                    ->where('dk.sinh_vien_id', $sinhVienId)
                    ->where('dk.trang_thai', 'ACTIVE')
                    ->whereNull('lhp.deleted_at');
            })
            ->when($hocKyId, fn ($q, $id) => $q->where('hoc_ky_id', $id))
            ->orderBy('ngay_thi')
            ->orderBy('gio_bat_dau')
            ->get();
    }

    public function tao(array $duLieu, int $nguoiThucHienId): LichThi
    {
        $duLieu = $this->chuanHoa($duLieu);

        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            PhongHoc::query()->lockForUpdate()->findOrFail($duLieu['phong_hoc_id']);
            $this->kiemTraTrungPhong($duLieu, null);

            $caThi = LichThi::query()->create($duLieu);
            NhatKy::ghi('lich_thi', $caThi->id, NhatKy::TAO, nguoiThucHienId: $nguoiThucHienId);

            return $caThi;
        });
    }

    public function sua(LichThi $caThi, array $duLieu, int $nguoiThucHienId): LichThi
    {
        $duLieu = $this->chuanHoa($duLieu + [
            'hoc_ky_id' => $caThi->hoc_ky_id,
            'mon_hoc_id' => $caThi->mon_hoc_id,
            'ngay_thi' => $caThi->ngay_thi->toDateString(),
            'tiet_bat_dau' => $caThi->tiet_bat_dau,
            'tiet_ket_thuc' => $caThi->tiet_ket_thuc,
            'phong_hoc_id' => $caThi->phong_hoc_id,
            'dot_thi' => $caThi->dot_thi,
            'ghi_chu' => $caThi->ghi_chu,
        ]);

        return DB::transaction(function () use ($caThi, $duLieu, $nguoiThucHienId) {
            PhongHoc::query()->lockForUpdate()->findOrFail($duLieu['phong_hoc_id']);
            $this->kiemTraTrungPhong($duLieu, $caThi->id);

            $caThi->update($duLieu);
            NhatKy::ghi('lich_thi', $caThi->id, NhatKy::CAP_NHAT, nguoiThucHienId: $nguoiThucHienId);

            return $caThi->fresh();
        });
    }

    public function xoa(LichThi $caThi, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($caThi, $nguoiThucHienId) {
            $caThi->delete();
            NhatKy::ghi('lich_thi', $caThi->id, NhatKy::XOA, nguoiThucHienId: $nguoiThucHienId);
        });
    }

    private function chuanHoa(array $duLieu): array
    {
        $duLieu = Validator::make($duLieu, [
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_ky,id'],
            'mon_hoc_id' => ['required', 'integer', 'exists:mon_hoc,id'],
            'ngay_thi' => ['required', 'date_format:Y-m-d'],
            'tiet_bat_dau' => ['required', 'integer', 'between:1,15'],
            'tiet_ket_thuc' => ['required', 'integer', 'between:1,15', 'gte:tiet_bat_dau'],
            'phong_hoc_id' => ['required', 'integer', 'exists:phong_hoc,id'],
            'dot_thi' => ['nullable', 'string', 'max:50'],
            'ghi_chu' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $hocKy = HocKy::query()->findOrFail($duLieu['hoc_ky_id']);
        if ($hocKy->trang_thai === HocKy::CLOSED) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã kết thúc, không xếp lịch thi được.');
        }

        $ngay = $duLieu['ngay_thi'];
        if ($ngay < $hocKy->ngay_bat_dau->toDateString() || $ngay > $hocKy->ngay_ket_thuc->toDateString()) {
            throw new LoiNghiepVu(
                'SESSION_OUTSIDE_SEMESTER',
                'Ngày thi nằm ngoài khoảng ngày của học kỳ.',
            );
        }

        $monHoc = MonHoc::query()->find($duLieu['mon_hoc_id']);
        if ($monHoc === null || ! $monHoc->trang_thai) {
            throw ValidationException::withMessages(['mon_hoc_id' => 'Môn học không hoạt động.']);
        }

        $phong = PhongHoc::query()->find($duLieu['phong_hoc_id']);
        if ($phong === null || ! $phong->trang_thai) {
            throw ValidationException::withMessages(['phong_hoc_id' => 'Phòng thi không tồn tại hoặc đã ngừng sử dụng.']);
        }

        $khung = $this->khungGio((int) $duLieu['tiet_bat_dau'], (int) $duLieu['tiet_ket_thuc']);

        return [
            ...$duLieu,
            'hoc_ky_id' => (int) $duLieu['hoc_ky_id'],
            'mon_hoc_id' => (int) $duLieu['mon_hoc_id'],
            'phong_hoc_id' => (int) $duLieu['phong_hoc_id'],
            'tiet_bat_dau' => (int) $duLieu['tiet_bat_dau'],
            'tiet_ket_thuc' => (int) $duLieu['tiet_ket_thuc'],
            'gio_bat_dau' => $khung['gio_bat_dau'],
            'gio_ket_thuc' => $khung['gio_ket_thuc'],
        ];
    }

    /**
     * @return array{gio_bat_dau: string, gio_ket_thuc: string}
     */
    private function khungGio(int $batDau, int $ketThuc): array
    {
        $tiet = TietHoc::query()
            ->whereIn('so_tiet', range($batDau, $ketThuc))
            ->get(['so_tiet', 'gio_bat_dau', 'gio_ket_thuc'])
            ->keyBy('so_tiet');

        if ($tiet->count() !== $ketThuc - $batDau + 1) {
            throw ValidationException::withMessages([
                'tiet_bat_dau' => 'Khung tiết chưa được cấu hình. Chạy seeder TietHocSeeder.',
            ]);
        }

        return [
            'gio_bat_dau' => $this->gio($tiet[$batDau]->gio_bat_dau),
            'gio_ket_thuc' => $this->gio($tiet[$ketThuc]->gio_ket_thuc),
        ];
    }

    private function gio(string $gio): string
    {
        return strlen($gio) === 5 ? $gio.':00' : $gio;
    }

    private function kiemTraTrungPhong(array $duLieu, ?int $boQuaId): void
    {
        $trung = LichThi::query()
            ->where('phong_hoc_id', $duLieu['phong_hoc_id'])
            ->whereDate('ngay_thi', $duLieu['ngay_thi'])
            ->whereTime('gio_bat_dau', '<', $duLieu['gio_ket_thuc'])
            ->whereTime('gio_ket_thuc', '>', $duLieu['gio_bat_dau'])
            ->when($boQuaId !== null, fn ($q) => $q->whereKeyNot($boQuaId))
            ->with('monHoc:id,ma_mon,ten_mon')
            ->get();

        if ($trung->isNotEmpty()) {
            throw new LoiNghiepVu(
                'SCHEDULE_CONFLICT',
                'Phòng thi đã có ca thi khác trong cùng khung giờ.',
                errors: [
                    'trung_lich' => $trung->map(fn (LichThi $ca) => [
                        'lich_thi_id' => $ca->id,
                        'mon_hoc' => $ca->monHoc?->ten_mon,
                        'ngay_thi' => $ca->ngay_thi->format('Y-m-d'),
                        'gio_bat_dau' => substr($ca->gio_bat_dau, 0, 5),
                        'gio_ket_thuc' => substr($ca->gio_ket_thuc, 0, 5),
                        'loai' => 'phong_hoc',
                        'doi_tuong' => $ca->phongHoc?->ma_phong,
                    ])->all(),
                ],
            );
        }
    }
}
