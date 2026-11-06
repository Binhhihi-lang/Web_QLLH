<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\LoiNghiepVu;
use App\Http\Resources\HocKyResource;
use App\Models\HocKy;
use App\Models\QuyDoiDiem;
use App\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HocKyController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_hoc_ky,ten_hoc_ky,nam_hoc,ky_thu,ngay_bat_dau,ngay_ket_thuc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'nam_hoc' => ['sometimes', 'string', 'max:9'],
            'ky_thu' => ['sometimes', 'integer', 'in:1,2,3'],
            'trang_thai' => ['sometimes', 'in:UPCOMING,ONGOING,CLOSED'],
        ]);

        $query = HocKy::query()
            ->when($request->filled('q'), fn ($query) => $query->where(function ($search) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $search->where('ma_hoc_ky', 'like', $term)
                    ->orWhere('ten_hoc_ky', 'like', $term);
            }))
            ->when($request->filled('nam_hoc'), fn ($query) => $query->where('nam_hoc', $request->input('nam_hoc')))
            ->when($request->filled('ky_thu'), fn ($query) => $query->where('ky_thu', $request->integer('ky_thu')))
            ->when($request->filled('trang_thai'), fn ($query) => $query->where('trang_thai', $request->input('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            HocKyResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function show(HocKy $hocKy): JsonResponse
    {
        return $this->success(new HocKyResource($hocKy));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->duLieuHopLe($request);
        $this->chanTrungLich($data);

        $hocKy = HocKy::query()->create([...$data, 'trang_thai' => HocKy::UPCOMING]);

        return $this->success(new HocKyResource($hocKy), 'Tạo học kỳ thành công.', 201);
    }

    public function update(Request $request, HocKy $hocKy): JsonResponse
    {
        if ($hocKy->trang_thai === HocKy::CLOSED) {
            throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng, chỉ được xem.');
        }

        $data = $this->duLieuHopLe($request, $hocKy);
        $this->chanTrungLich($data, $hocKy);
        $hocKy->update($data);

        return $this->success(new HocKyResource($hocKy->fresh()), 'Cập nhật học kỳ thành công.');
    }

    public function destroy(Request $request, HocKy $hocKy): JsonResponse
    {
        if ($hocKy->trang_thai !== HocKy::UPCOMING) {
            $maLoi = $hocKy->trang_thai === HocKy::CLOSED ? 'SEMESTER_CLOSED' : 'DELETE_BLOCKED';
            throw new LoiNghiepVu($maLoi, 'Chỉ xóa được học kỳ sắp diễn ra.');
        }
        if ($hocKy->lopHocPhan()->exists()) {
            throw new LoiNghiepVu('SEMESTER_HAS_SECTIONS', 'Chỉ xóa được học kỳ sắp diễn ra chưa có lớp học phần.');
        }

        $hocKy->forceFill(['deleted_by' => $request->user()->id])->save();
        $hocKy->delete();

        return $this->success(null, 'Xóa học kỳ thành công.');
    }

    public function capNhatTrangThai(Request $request, HocKy $hocKy): JsonResponse
    {
        $data = $request->validate(['trang_thai' => ['required', 'in:UPCOMING,ONGOING,CLOSED']]);
        $dich = $data['trang_thai'];
        $updated = DB::transaction(function () use ($hocKy, $dich): HocKy {
            $hocKy = HocKy::query()->lockForUpdate()->findOrFail($hocKy->id);
            $hopLe = ($hocKy->trang_thai === HocKy::UPCOMING && $dich === HocKy::ONGOING)
                || ($hocKy->trang_thai === HocKy::ONGOING && $dich === HocKy::CLOSED);

            if (! $hopLe || ($dich === HocKy::ONGOING && HocKy::query()
                ->where('trang_thai', HocKy::ONGOING)->whereKeyNot($hocKy->id)->exists())) {
                throw new LoiNghiepVu('SEMESTER_TRANSITION_INVALID', 'Không thể chuyển trạng thái học kỳ theo hướng này.');
            }

            if ($dich === HocKy::ONGOING && ! QuyDoiDiem::query()->where('hoc_ky_id', $hocKy->id)->exists()) {
                throw new LoiNghiepVu(
                    'SEMESTER_CONFIG_REQUIRED',
                    'Cần lưu cấu hình điểm của học kỳ trước khi bắt đầu học kỳ.',
                );
            }

            $hocKy->update(['trang_thai' => $dich]);

            return $hocKy->fresh();
        });

        return $this->success(new HocKyResource($updated), 'Cập nhật trạng thái học kỳ thành công.');
    }

    /** @return array<string, mixed> */
    private function duLieuHopLe(Request $request, ?HocKy $hocKy = null): array
    {
        $data = $request->validate([
            'ma_hoc_ky' => ['required', 'string', 'max:20', 'regex:/^\d{4}-[1-3]$/', 'unique:hoc_ky,ma_hoc_ky,'.$hocKy?->id],
            'ten_hoc_ky' => ['required', 'string', 'max:255'],
            'nam_hoc' => ['required', 'string', 'regex:/^(\d{4})-(\d{4})$/'],
            'ky_thu' => ['required', 'integer', 'in:1,2,3'],
            'ngay_bat_dau' => ['required', 'date_format:Y-m-d'],
            'ngay_ket_thuc' => ['required', 'date_format:Y-m-d', 'after:ngay_bat_dau'],
            'mo_dang_ky_luc' => ['required', 'date_format:Y-m-d H:i:s', 'before_or_equal:dong_dang_ky_luc'],
            'dong_dang_ky_luc' => ['required', 'date_format:Y-m-d H:i:s', 'after:mo_dang_ky_luc'],
        ]);

        if (substr($data['dong_dang_ky_luc'], 0, 10) > $data['ngay_bat_dau']) {
            throw new LoiNghiepVu('VALIDATION_ERROR', 'Đợt đăng ký phải đóng trước hoặc đúng ngày bắt đầu học kỳ.', 422, [
                'dong_dang_ky_luc' => ['Đợt đăng ký phải đóng trước hoặc đúng ngày bắt đầu học kỳ.'],
            ]);
        }

        return $data;
    }

    /** @param array<string, mixed> $data */
    private function chanTrungLich(array $data, ?HocKy $hocKy = null): void
    {
        $nam = explode('-', $data['nam_hoc']);
        if ((int) $nam[1] !== (int) $nam[0] + 1 || (int) substr($data['ma_hoc_ky'], 0, 4) !== (int) $nam[0]) {
            throw new LoiNghiepVu('VALIDATION_ERROR', 'Mã học kỳ phải khớp năm bắt đầu của năm học.', 422, [
                'nam_hoc' => ['Năm học cần gồm hai năm liên tiếp và khớp mã học kỳ.'],
            ]);
        }

        $query = HocKy::withTrashed()->where('nam_hoc', $data['nam_hoc'])->where('ky_thu', $data['ky_thu']);
        if ($hocKy) $query->whereKeyNot($hocKy->id);
        if ($query->exists()) {
            throw new LoiNghiepVu('VALIDATION_ERROR', 'Năm học đã có học kỳ cùng kỳ thứ.', 422, [
                'ky_thu' => ['Mỗi năm học chỉ có một học kỳ cho từng kỳ thứ.'],
            ]);
        }

        $overlap = HocKy::query()->when($hocKy, fn ($query) => $query->whereKeyNot($hocKy->id))
            ->whereDate('ngay_bat_dau', '<=', $data['ngay_ket_thuc'])
            ->whereDate('ngay_ket_thuc', '>=', $data['ngay_bat_dau'])
            ->orderBy('ngay_bat_dau')
            ->first();
        if ($overlap !== null) {
            $ngayBatDau = $overlap->ngay_bat_dau->toDateString();
            $ngayKetThuc = $overlap->ngay_ket_thuc->toDateString();

            throw new LoiNghiepVu(
                'SEMESTER_OVERLAP',
                "Khoảng ngày {$data['ngay_bat_dau']} đến {$data['ngay_ket_thuc']} bị chồng lấn với học kỳ {$overlap->ma_hoc_ky} - {$overlap->ten_hoc_ky} ({$ngayBatDau} đến {$ngayKetThuc}).",
                errors: [
                    'hoc_ky_trung' => [
                        'ma_hoc_ky' => $overlap->ma_hoc_ky,
                        'ten_hoc_ky' => $overlap->ten_hoc_ky,
                        'ngay_bat_dau' => $ngayBatDau,
                        'ngay_ket_thuc' => $ngayKetThuc,
                    ],
                ],
            );
        }
    }
}
