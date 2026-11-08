<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\TietHoc;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Nghiệp vụ ghi lịch học: sinh lịch hàng tuần, thêm/sửa/hủy buổi.
 *
 * Kiểm tra trùng lịch dùng ScheduleService (BR-06/BR-22). Ghi và kiểm tra
 * phải nằm trong cùng transaction, khóa phòng học để hai lần mở lớp đồng
 * thời không sinh ra hai buổi trùng phòng.
 */
class QuanLyBuoiHocService
{
    private const SO_BUOI_TOI_DA = 500;

    public function __construct(private readonly ScheduleService $scheduleService) {}

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, BuoiHoc>
     */
    public function sinhLich(LopHocPhan $lop, array $duLieu, int $nguoiThucHienId)
    {
        $duLieu = Validator::make($duLieu, [
            'thu' => ['required', 'array', 'min:1', 'max:7'],
            'thu.*' => ['integer', 'between:2,8', 'distinct'],
            'tiet_bat_dau' => ['required', 'integer', 'between:1,15'],
            'tiet_ket_thuc' => ['required', 'integer', 'between:1,15', 'gte:tiet_bat_dau'],
            'phong_hoc_id' => ['required', 'integer'],
            'tu_ngay' => ['required', 'date_format:Y-m-d'],
            'den_ngay' => ['required', 'date_format:Y-m-d', 'after_or_equal:tu_ngay'],
        ])->validate();

        $this->kiemTraLopChoGhi($lop);

        $phong = PhongHoc::query()->find($duLieu['phong_hoc_id']);
        if ($phong === null || ! $phong->trang_thai) {
            throw ValidationException::withMessages(['phong_hoc_id' => 'Phòng học không tồn tại hoặc đã ngừng sử dụng.']);
        }

        $khung = $this->khungGioCuaTiet((int) $duLieu['tiet_bat_dau'], (int) $duLieu['tiet_ket_thuc']);

        $tuNgay = CarbonImmutable::createFromFormat('Y-m-d', $duLieu['tu_ngay'])->startOfDay();
        $denNgay = CarbonImmutable::createFromFormat('Y-m-d', $duLieu['den_ngay'])->startOfDay();
        $this->kiemTraNgayTrongKy($lop, $tuNgay, 'tu_ngay');

        // FR-10.02: vượt quá ngày kết thúc học kỳ thì dừng, không báo lỗi.
        $ketThucHocKy = CarbonImmutable::instance($lop->hocKy->ngay_ket_thuc)->startOfDay();
        if ($denNgay->greaterThan($ketThucHocKy)) {
            $denNgay = $ketThucHocKy;
        }

        // Quy ước Việt Nam: 2..7 là Thứ 2..Thứ 7, 8 là Chủ nhật.
        // Carbon dayOfWeekIso: 1..7 là Thứ 2..Chủ nhật.
        $thu = collect($duLieu['thu'])->map(fn ($t) => $t === 8 ? 7 : (int) $t - 1)->all();
        $cacBuoi = [];
        $ngay = $tuNgay;

        while ($ngay->lessThanOrEqualTo($denNgay)) {
            if (in_array($ngay->dayOfWeekIso, $thu, true)) {
                $cacBuoi[] = [
                    'ngay_hoc' => $ngay->toDateString(),
                    'gio_bat_dau' => $khung['gio_bat_dau'],
                    'gio_ket_thuc' => $khung['gio_ket_thuc'],
                    'phong_hoc_id' => (int) $duLieu['phong_hoc_id'],
                    'tiet_bat_dau' => (int) $duLieu['tiet_bat_dau'],
                    'tiet_ket_thuc' => (int) $duLieu['tiet_ket_thuc'],
                ];
            }

            $ngay = $ngay->addDay();
        }

        if ($cacBuoi === []) {
            throw ValidationException::withMessages(['thu' => 'Khoảng ngày đã chọn không có ngày nào rơi vào thứ đã chọn.']);
        }

        if (count($cacBuoi) > self::SO_BUOI_TOI_DA) {
            throw ValidationException::withMessages(['den_ngay' => 'Một lần sinh tối đa '.self::SO_BUOI_TOI_DA.' buổi.']);
        }

        return DB::transaction(function () use ($lop, $cacBuoi, $phong, $nguoiThucHienId) {
            // Khóa phòng để hai lần sinh lịch đồng thời không cùng đọc thấy phòng trống.
            PhongHoc::query()->lockForUpdate()->findOrFail($phong->id);

            $this->scheduleService->kiemTraDanhSach($lop, $cacBuoi);

            $daTao = new EloquentCollection();
            foreach ($cacBuoi as $buoi) {
                $daTao->push(BuoiHoc::query()->create([
                    ...$buoi,
                    'lop_hoc_phan_id' => $lop->id,
                    'trang_thai' => BuoiHoc::SCHEDULED,
                ]));
            }

            NhatKy::ghi(
                'buoi_hoc',
                $daTao->first()->id,
                NhatKy::TAO,
                nguoiThucHienId: $nguoiThucHienId,
                ghiChu: 'Sinh '.$daTao->count().' buổi cho lớp '.$lop->ma_lop_hp,
            );

            return $daTao;
        });
    }

    public function tao(LopHocPhan $lop, array $duLieu, int $nguoiThucHienId): BuoiHoc
    {
        $duLieu = $this->chuanHoaDauVao($duLieu);
        $this->kiemTraLopChoGhi($lop);

        $phong = PhongHoc::query()->find($duLieu['phong_hoc_id']);
        if ($phong === null || ! $phong->trang_thai) {
            throw ValidationException::withMessages(['phong_hoc_id' => 'Phòng học không tồn tại hoặc đã ngừng sử dụng.']);
        }

        $ngay = CarbonImmutable::createFromFormat('Y-m-d', $duLieu['ngay_hoc'])->startOfDay();
        $this->kiemTraNgayTrongKy($lop, $ngay, 'ngay_hoc');

        if (! empty($duLieu['buoi_goc_id'])) {
            $goc = BuoiHoc::query()
                ->where('lop_hoc_phan_id', $lop->id)
                ->where('trang_thai', BuoiHoc::CANCELLED)
                ->find($duLieu['buoi_goc_id']);

            if ($goc === null) {
                throw ValidationException::withMessages([
                    'buoi_goc_id' => 'Buổi gốc không tồn tại, không thuộc lớp này, hoặc chưa bị hủy.',
                ]);
            }
        }

        return DB::transaction(function () use ($lop, $duLieu, $phong, $nguoiThucHienId) {
            PhongHoc::query()->lockForUpdate()->findOrFail($phong->id);
            $this->scheduleService->kiemTraTrungLich($lop, $duLieu);

            $buoi = BuoiHoc::query()->create([
                ...$duLieu,
                'lop_hoc_phan_id' => $lop->id,
                'trang_thai' => BuoiHoc::SCHEDULED,
            ]);

            NhatKy::ghi('buoi_hoc', $buoi->id, NhatKy::TAO, nguoiThucHienId: $nguoiThucHienId);

            return $buoi;
        });
    }

    public function sua(BuoiHoc $buoi, array $duLieu, bool $xacNhan, int $nguoiThucHienId): BuoiHoc
    {
        $lop = $buoi->lopHocPhan;
        $this->kiemTraLopChoGhi($lop);
        $this->kiemTraChuaCoDiemDanh($buoi, $xacNhan);

        $duLieu = $this->chuanHoaDauVao($duLieu + [
            'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
            'gio_bat_dau' => substr($buoi->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($buoi->gio_ket_thuc, 0, 5),
            'phong_hoc_id' => $buoi->phong_hoc_id,
        ]);

        $ngay = CarbonImmutable::createFromFormat('Y-m-d', $duLieu['ngay_hoc'])->startOfDay();
        $this->kiemTraNgayTrongKy($lop, $ngay, 'ngay_hoc');

        return DB::transaction(function () use ($buoi, $lop, $duLieu, $nguoiThucHienId) {
            PhongHoc::query()->lockForUpdate()->findOrFail($duLieu['phong_hoc_id']);
            $this->scheduleService->kiemTraTrungLich($lop, $duLieu, $buoi->id);

            $cu = $buoi->only(['ngay_hoc', 'gio_bat_dau', 'gio_ket_thuc', 'phong_hoc_id', 'tiet_bat_dau', 'tiet_ket_thuc']);
            $buoi->update($duLieu);

            NhatKy::ghi(
                'buoi_hoc',
                $buoi->id,
                NhatKy::CAP_NHAT,
                giaTriCu: $cu,
                giaTriMoi: $buoi->only(['ngay_hoc', 'gio_bat_dau', 'gio_ket_thuc', 'phong_hoc_id', 'tiet_bat_dau', 'tiet_ket_thuc']),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $buoi->fresh();
        });
    }

    /**
     * Hủy buổi: giữ bản ghi trên lịch để đối chiếu, không xóa mềm.
     */
    public function huy(BuoiHoc $buoi, ?string $lyDo, bool $xacNhan, int $nguoiThucHienId): BuoiHoc
    {
        $this->kiemTraChuaCoDiemDanh($buoi, $xacNhan);

        if ($buoi->trang_thai === BuoiHoc::DONE) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Buổi học đã dạy, không hủy được.');
        }

        $buoi->update([
            'trang_thai' => BuoiHoc::CANCELLED,
            'ly_do_huy' => $lyDo,
        ]);

        NhatKy::ghi('buoi_hoc', $buoi->id, NhatKy::DOI_TRANG_THAI, nguoiThucHienId: $nguoiThucHienId, ghiChu: 'Hủy buổi');

        return $buoi->fresh();
    }

    public function moLai(BuoiHoc $buoi, int $nguoiThucHienId): BuoiHoc
    {
        if ($buoi->trang_thai !== BuoiHoc::CANCELLED) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Chỉ mở lại buổi đang bị hủy.');
        }

        $lop = $buoi->lopHocPhan;
        $duLieu = [
            'ngay_hoc' => $buoi->ngay_hoc->toDateString(),
            'gio_bat_dau' => substr($buoi->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($buoi->gio_ket_thuc, 0, 5),
            'phong_hoc_id' => $buoi->phong_hoc_id,
        ];

        return DB::transaction(function () use ($buoi, $lop, $duLieu, $nguoiThucHienId) {
            $this->scheduleService->kiemTraTrungLich($lop, $duLieu, $buoi->id);
            $buoi->update(['trang_thai' => BuoiHoc::SCHEDULED, 'ly_do_huy' => null]);
            NhatKy::ghi('buoi_hoc', $buoi->id, NhatKy::DOI_TRANG_THAI, nguoiThucHienId: $nguoiThucHienId, ghiChu: 'Mở lại buổi');

            return $buoi->fresh();
        });
    }

    public function xoa(BuoiHoc $buoi, bool $xacNhan, int $nguoiThucHienId): void
    {
        $this->kiemTraChuaCoDiemDanh($buoi, $xacNhan);

        DB::transaction(function () use ($buoi, $nguoiThucHienId) {
            $buoi->deleted_by = $nguoiThucHienId;
            $buoi->save();
            $buoi->delete();
            NhatKy::ghi('buoi_hoc', $buoi->id, NhatKy::XOA, nguoiThucHienId: $nguoiThucHienId);
        });
    }

    /**
     * @return array{ngay_hoc: string, gio_bat_dau: string, gio_ket_thuc: string, phong_hoc_id: int, tiet_bat_dau: ?int, tiet_ket_thuc: ?int}
     */
    private function chuanHoaDauVao(array $duLieu): array
    {
        $duLieu = Validator::make($duLieu, [
            'ngay_hoc' => ['required', 'date_format:Y-m-d'],
            'phong_hoc_id' => ['required', 'integer', 'min:1'],
            'tiet_bat_dau' => ['sometimes', 'nullable', 'integer', 'between:1,15'],
            'tiet_ket_thuc' => ['sometimes', 'nullable', 'integer', 'between:1,15', 'required_with:tiet_bat_dau', 'gte:tiet_bat_dau'],
            'gio_bat_dau' => ['required_without:tiet_bat_dau', 'nullable', 'date_format:H:i,H:i:s'],
            'gio_ket_thuc' => ['required_without:tiet_bat_dau', 'nullable', 'date_format:H:i,H:i:s', 'after:gio_bat_dau'],
            'buoi_goc_id' => ['sometimes', 'nullable', 'integer'],
        ])->validate();

        if (! empty($duLieu['tiet_bat_dau'])) {
            $khung = $this->khungGioCuaTiet((int) $duLieu['tiet_bat_dau'], (int) $duLieu['tiet_ket_thuc']);
            $duLieu['gio_bat_dau'] = $khung['gio_bat_dau'];
            $duLieu['gio_ket_thuc'] = $khung['gio_ket_thuc'];
        } else {
            $duLieu['tiet_bat_dau'] = null;
            $duLieu['tiet_ket_thuc'] = null;
            $duLieu['gio_bat_dau'] = $this->gio($duLieu['gio_bat_dau']);
            $duLieu['gio_ket_thuc'] = $this->gio($duLieu['gio_ket_thuc']);
        }

        $duLieu['ngay_hoc'] = $duLieu['ngay_hoc'];
        $duLieu['phong_hoc_id'] = (int) $duLieu['phong_hoc_id'];

        return $duLieu;
    }

    /**
     * @return array{gio_bat_dau: string, gio_ket_thuc: string}
     */
    private function khungGioCuaTiet(int $batDau, int $ketThuc): array
    {
        if ($ketThuc < $batDau) {
            throw ValidationException::withMessages(['tiet_ket_thuc' => 'Tiết kết thúc phải sau tiết bắt đầu.']);
        }

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

    private function gio(?string $gio): string
    {
        $gio = (string) $gio;

        return strlen($gio) === 5 ? $gio.':00' : $gio;
    }

    private function kiemTraLopChoGhi(LopHocPhan $lop): void
    {
        if ($lop->trang_thai === LopHocPhan::CANCELLED) {
            throw new LoiNghiepVu('SECTION_NOT_OPEN', 'Lớp học phần đã hủy, không xếp lịch được.');
        }

        if ($lop->hocKy?->trang_thai === HocKy::CLOSED) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã kết thúc, không xếp lịch được.');
        }
    }

    private function kiemTraNgayTrongKy(LopHocPhan $lop, CarbonImmutable $ngay, string $truong): void
    {
        $batDau = CarbonImmutable::instance($lop->hocKy->ngay_bat_dau)->startOfDay();
        $ketThuc = CarbonImmutable::instance($lop->hocKy->ngay_ket_thuc)->startOfDay();

        if ($ngay->lessThan($batDau) || $ngay->greaterThan($ketThuc)) {
            throw new LoiNghiepVu(
                'SESSION_OUTSIDE_SEMESTER',
                'Ngày học nằm ngoài khoảng ngày của học kỳ.',
                errors: [$truong => ['Kỳ học từ '.$batDau->toDateString().' đến '.$ketThuc->toDateString().'.']],
            );
        }
    }

    private function kiemTraChuaCoDiemDanh(BuoiHoc $buoi, bool $xacNhan): void
    {
        if ($xacNhan) {
            return;
        }

        if ($buoi->diemDanh()->exists()) {
            throw new LoiNghiepVu(
                'DELETE_BLOCKED',
                'Buổi học đã có điểm danh. Gửi xac_nhan: true để tiếp tục.',
            );
        }
    }
}
