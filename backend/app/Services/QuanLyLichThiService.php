<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LichThi;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\TietHoc;
use Carbon\CarbonImmutable;
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
            $this->kiemTraTrungPhongVoiBuoiHoc($duLieu);
            $this->kiemTraSinhVienRanh($duLieu, null);

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
        ], kiemTraQuaKhu: false);

        if ($duLieu['ngay_thi'] !== $caThi->ngay_thi->toDateString()
            && $duLieu['ngay_thi'] < now()->startOfDay()->toDateString()) {
            throw new LoiNghiepVu(
                'PAST_DATE',
                'Không thể dời ca thi sang ngày đã qua.',
                errors: ['ngay_thi' => ['Chọn ngày từ hôm nay trở đi.']],
            );
        }

        return DB::transaction(function () use ($caThi, $duLieu, $nguoiThucHienId) {
            PhongHoc::query()->lockForUpdate()->findOrFail($duLieu['phong_hoc_id']);
            $this->kiemTraTrungPhong($duLieu, $caThi->id);
            $this->kiemTraTrungPhongVoiBuoiHoc($duLieu);
            $this->kiemTraSinhVienRanh($duLieu, $caThi->id);

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

    private function chuanHoa(array $duLieu, bool $kiemTraQuaKhu = true): array
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

        if ($kiemTraQuaKhu && $ngay < now()->startOfDay()->toDateString()) {
            throw new LoiNghiepVu(
                'PAST_DATE',
                'Không thể xếp lịch thi cho ngày đã qua.',
                errors: ['ngay_thi' => ['Chọn ngày từ hôm nay trở đi.']],
            );
        }

        if ($ngay < now()->startOfDay()->toDateString()) {
            throw new LoiNghiepVu(
                'PAST_DATE',
                'Không thể xếp lịch thi cho ngày đã qua.',
                errors: ['ngay_thi' => ['Chọn ngày từ hôm nay trở đi.']],
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

    /**
     * Phòng thi không được đè lên lớp đang học. Trước đây hai bảng không nhìn
     * thấy nhau nên dữ liệu demo đã có một ca thi nằm chồng buổi học.
     */
    private function kiemTraTrungPhongVoiBuoiHoc(array $duLieu): void
    {
        $trung = BuoiHoc::query()
            ->where('phong_hoc_id', $duLieu['phong_hoc_id'])
            ->whereDate('ngay_hoc', $duLieu['ngay_thi'])
            ->where('trang_thai', BuoiHoc::SCHEDULED)
            ->whereTime('gio_bat_dau', '<', $duLieu['gio_ket_thuc'])
            ->whereTime('gio_ket_thuc', '>', $duLieu['gio_bat_dau'])
            ->with('lopHocPhan:id,ma_lop_hp')
            ->get();

        if ($trung->isNotEmpty()) {
            throw new LoiNghiepVu(
                'SCHEDULE_CONFLICT',
                'Phòng thi trùng giờ với lớp đang học.',
                errors: [
                    'trung_lich' => $trung->map(fn (BuoiHoc $buoi) => [
                        'buoi_hoc_id' => $buoi->id,
                        'ngay_hoc' => $buoi->ngay_hoc->format('Y-m-d'),
                        'gio_bat_dau' => substr($buoi->gio_bat_dau, 0, 5),
                        'gio_ket_thuc' => substr($buoi->gio_ket_thuc, 0, 5),
                        'ma_lop_hp' => $buoi->lopHocPhan?->ma_lop_hp,
                        'loai' => 'buoi_hoc',
                    ])->all(),
                ],
            );
        }
    }

    /**
     * Ca thi phục vụ MỌI lớp của môn trong kỳ, nên không được rơi vào lúc có
     * sinh viên nào của môn đó đang học ở lớp khác. Một môn có thể có trên 160
     * sinh viên: phải gom bằng một truy vấn join, không lặp từng sinh viên.
     */
    private function kiemTraSinhVienRanh(array $duLieu, ?int $boQuaId): void
    {
        $gioBatDau = substr($duLieu['gio_bat_dau'], 0, 5);
        $gioKetThuc = substr($duLieu['gio_ket_thuc'], 0, 5);

        // Sinh viên đang học môn này trong kỳ (kèm lớp để báo lỗi dễ hiểu).
        $sinhVienCuaMon = DB::table('dang_ky_hoc_phan as dk')
            ->join('lop_hoc_phan as l', 'l.id', '=', 'dk.lop_hoc_phan_id')
            ->where('dk.trang_thai', 'ACTIVE')
            ->whereNull('l.deleted_at')
            ->where('l.hoc_ky_id', $duLieu['hoc_ky_id'])
            ->where('l.mon_hoc_id', $duLieu['mon_hoc_id'])
            ->distinct()
            ->select('dk.sinh_vien_id', 'l.ma_lop_hp');

        // Vướng buổi học của bất kỳ lớp nào họ đang đăng ký, cùng ngày, giờ giao nhau.
        $vuongBuoiHoc = DB::table('buoi_hoc as b')
            ->join('lop_hoc_phan as l2', 'l2.id', '=', 'b.lop_hoc_phan_id')
            ->join('dang_ky_hoc_phan as dk2', 'dk2.lop_hoc_phan_id', '=', 'l2.id')
            ->joinSub($sinhVienCuaMon, 'sv', 'sv.sinh_vien_id', '=', 'dk2.sinh_vien_id')
            ->join('sinh_vien as s', 's.id', '=', 'dk2.sinh_vien_id')
            ->where('dk2.trang_thai', 'ACTIVE')
            ->whereNull('l2.deleted_at')
            ->where('b.trang_thai', BuoiHoc::SCHEDULED)
            ->whereNull('b.deleted_at')
            ->whereDate('b.ngay_hoc', $duLieu['ngay_thi'])
            ->whereTime('b.gio_bat_dau', '<', $gioKetThuc)
            ->whereTime('b.gio_ket_thuc', '>', $gioBatDau)
            ->distinct()
            ->select(
                'dk2.sinh_vien_id',
                's.ma_sv',
                's.ho_ten',
                'l2.ma_lop_hp',
                'b.ngay_hoc as ngay',
                'b.gio_bat_dau',
                'b.gio_ket_thuc',
                DB::raw("'buoi_hoc' as loai"),
            );

        // Vướng ca thi của môn khác mà họ cũng đăng ký, cùng ngày, giờ giao nhau.
        $vuongCaThi = DB::table('lich_thi as t')
            ->join('lop_hoc_phan as l3', function ($join) {
                // Lớp của chính môn có ca thi kia — chỉ sinh viên học môn đó mới vướng.
                $join->on('l3.hoc_ky_id', '=', 't.hoc_ky_id')
                    ->on('l3.mon_hoc_id', '=', 't.mon_hoc_id')
                    ->whereNull('l3.deleted_at');
            })
            ->join('dang_ky_hoc_phan as dk3', function ($join) {
                $join->on('dk3.lop_hoc_phan_id', '=', 'l3.id')
                    ->where('dk3.trang_thai', 'ACTIVE');
            })
            ->joinSub($sinhVienCuaMon, 'sv2', 'sv2.sinh_vien_id', '=', 'dk3.sinh_vien_id')
            ->join('sinh_vien as s3', 's3.id', '=', 'dk3.sinh_vien_id')
            ->whereNull('t.deleted_at')
            ->whereDate('t.ngay_thi', $duLieu['ngay_thi'])
            ->whereTime('t.gio_bat_dau', '<', $gioKetThuc)
            ->whereTime('t.gio_ket_thuc', '>', $gioBatDau)
            ->when($boQuaId !== null, fn ($q) => $q->where('t.id', '!=', $boQuaId))
            ->distinct()
            ->select(
                'dk3.sinh_vien_id',
                's3.ma_sv',
                's3.ho_ten',
                'l3.ma_lop_hp',
                't.ngay_thi as ngay',
                't.gio_bat_dau',
                't.gio_ket_thuc',
                DB::raw("'lich_thi' as loai"),
            );

        $viPham = $vuongBuoiHoc->unionAll($vuongCaThi)->get();
        $tong = $viPham->count();

        if ($tong === 0) {
            return;
        }

        // 20 dòng đủ để admin thấy mẫu vi phạm; số còn lại chỉ cần biết tổng.
        $chiTiet = $viPham->take(20)->map(fn ($dong) => [
            'sinh_vien_id' => (int) $dong->sinh_vien_id,
            'ma_sv' => $dong->ma_sv,
            'ho_ten' => $dong->ho_ten,
            'ma_lop_hp' => $dong->ma_lop_hp,
            'ngay' => CarbonImmutable::parse($dong->ngay)->toDateString(),
            'gio_bat_dau' => substr((string) $dong->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr((string) $dong->gio_ket_thuc, 0, 5),
            'loai' => $dong->loai,
        ])->all();

        throw new LoiNghiepVu(
            'SCHEDULE_CONFLICT',
            'Ca thi trùng lịch của '.$tong.' sinh viên. Chọn ngày hoặc khung tiết khác.',
            errors: [
                'trung_lich' => $chiTiet,
                'tong_so_vi_pham' => $tong,
            ],
        );
    }
}
