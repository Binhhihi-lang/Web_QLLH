<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DangKy\DangKyHangLoatRequest;
use App\Http\Resources\DangKyHocPhanResource;
use App\Models\DangKyHocPhan;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Services\DangKyHocPhanService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DangKyHocPhanController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly DangKyHocPhanService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'hoc_ky_id' => ['sometimes', 'integer', 'exists:hoc_ky,id'],
            'lop_hoc_phan_id' => ['sometimes', 'integer', 'exists:lop_hoc_phan,id'],
            'sinh_vien_id' => ['sometimes', 'integer', 'exists:sinh_vien,id'],
            'trang_thai' => ['sometimes', Rule::in([DangKyHocPhan::ACTIVE, DangKyHocPhan::CANCELLED])],
        ]);

        $query = DangKyHocPhan::query()->with([
            'sinhVien', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'nguoiDangKy', 'nguoiHuy',
        ]);

        if ($request->user()->laGiangVien()) {
            $giangVienId = $request->user()->giangVien?->id ?? 0;
            $query->whereHas('lopHocPhan', fn ($lop) => $lop->where('giang_vien_id', $giangVienId));
        }

        $query
            ->when($request->filled('hoc_ky_id'), fn ($q) => $q->whereHas('lopHocPhan', fn ($lop) => $lop->where('hoc_ky_id', $request->integer('hoc_ky_id'))))
            ->when($request->filled('lop_hoc_phan_id'), fn ($q) => $q->where('lop_hoc_phan_id', $request->integer('lop_hoc_phan_id')))
            ->when($request->filled('sinh_vien_id'), fn ($q) => $q->where('sinh_vien_id', $request->integer('sinh_vien_id')))
            ->when($request->filled('trang_thai'), fn ($q) => $q->where('trang_thai', $request->string('trang_thai')->toString()))
            ->orderByDesc('dang_ky_luc')->orderByDesc('id');

        return $this->successPhanTrang(
            DangKyHocPhanResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $duLieu = $request->validate([
            'sinh_vien_id' => ['required', 'integer', 'exists:sinh_vien,id'],
            'lop_hoc_phan_id' => ['required', 'integer', 'exists:lop_hoc_phan,id'],
        ]);

        $sinhVien = SinhVien::query()->findOrFail($duLieu['sinh_vien_id']);
        $lop = LopHocPhan::query()->findOrFail($duLieu['lop_hoc_phan_id']);
        $dangKy = $this->service->dangKy($sinhVien, $lop, $request->user()->id, adminOverride: true);

        return $this->success(new DangKyHocPhanResource($dangKy), 'Đăng ký học phần thành công.', 201);
    }

    public function bulk(DangKyHangLoatRequest $request): JsonResponse
    {
        $duLieu = $request->validated();
        $lop = LopHocPhan::query()->findOrFail($duLieu['lop_hoc_phan_id']);
        $sinhVienIds = $duLieu['sinh_vien_ids'] ?? SinhVien::query()
            ->where('lop_hanh_chinh_id', $duLieu['lop_hanh_chinh_id'])
            ->orderBy('id')
            ->pluck('id')
            ->all();

        if (count($sinhVienIds) > 500) {
            return $this->error('Mỗi lần chỉ được xử lý tối đa 500 sinh viên.', 422, 'VALIDATION_ERROR', [
                'sinh_vien_ids' => ['Mỗi lần chỉ được xử lý tối đa 500 sinh viên.'],
            ]);
        }

        $data = $this->service->dangKyHangLoat($lop, $sinhVienIds, $request->user()->id);

        return $this->success($data, 'Đã xử lý '.count($sinhVienIds).' sinh viên.');
    }

    public function cuaToi(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'hoc_ky_id' => ['sometimes', 'integer', 'exists:hoc_ky,id'],
            'trang_thai' => ['sometimes', Rule::in([DangKyHocPhan::ACTIVE, DangKyHocPhan::CANCELLED])],
        ]);

        $sinhVienId = $request->user()->sinhVien?->id;
        abort_if($sinhVienId === null, 404, 'Không tìm thấy hồ sơ sinh viên.');

        $query = DangKyHocPhan::query()->with([
            'sinhVien', 'lopHocPhan.monHoc', 'lopHocPhan.hocKy', 'nguoiDangKy', 'nguoiHuy',
        ])->where('sinh_vien_id', $sinhVienId)
            ->when($request->filled('hoc_ky_id'), fn ($q) => $q->whereHas('lopHocPhan', fn ($lop) => $lop->where('hoc_ky_id', $request->integer('hoc_ky_id'))))
            ->when($request->filled('trang_thai'), fn ($q) => $q->where('trang_thai', $request->string('trang_thai')->toString()))
            ->orderByDesc('dang_ky_luc')->orderByDesc('id');

        return $this->successPhanTrang(
            DangKyHocPhanResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function cuaToiStore(Request $request): JsonResponse
    {
        $duLieu = $request->validate([
            'lop_hoc_phan_id' => ['required', 'integer', 'exists:lop_hoc_phan,id'],
        ]);
        $sinhVien = $request->user()->sinhVien;
        abort_if($sinhVien === null, 404, 'Không tìm thấy hồ sơ sinh viên.');

        $dangKy = $this->service->dangKy(
            $sinhVien,
            LopHocPhan::query()->findOrFail($duLieu['lop_hoc_phan_id']),
            $request->user()->id,
        );

        return $this->success(new DangKyHocPhanResource($dangKy), 'Đăng ký học phần thành công.', 201);
    }

    public function destroy(int $dangKy): JsonResponse
    {
        $banGhi = DangKyHocPhan::query()->findOrFail($dangKy);
        $duLieu = request()->validate(['ly_do' => ['sometimes', 'nullable', 'string', 'max:500']]);
        $banGhi = $this->service->huy($banGhi, request()->user(), $duLieu['ly_do'] ?? null);

        return $this->success(new DangKyHocPhanResource($banGhi), 'Hủy đăng ký học phần thành công.');
    }

    public function cuaToiDestroy(int $dangKy): JsonResponse
    {
        $banGhi = DangKyHocPhan::query()->findOrFail($dangKy);
        abort_unless($banGhi->sinh_vien_id === request()->user()->sinhVien?->id, 404);
        $banGhi = $this->service->huy($banGhi, request()->user());

        return $this->success(new DangKyHocPhanResource($banGhi), 'Hủy đăng ký học phần thành công.');
    }
}
