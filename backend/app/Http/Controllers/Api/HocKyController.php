<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\HocKyRequest;
use App\Http\Requests\QuanLy\TrangThaiHocKyRequest;
use App\Http\Resources\HocKyResource;
use App\Models\HocKy;
use App\Services\QuanLyHocKyService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HocKyController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyHocKyService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_hoc_ky,ten_hoc_ky,nam_hoc,ky_thu,ngay_bat_dau,ngay_ket_thuc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'nam_hoc' => ['sometimes', 'string', 'max:9'],
            'ky_thu' => ['sometimes', 'integer', 'between:1,3'],
            'trang_thai' => ['sometimes', Rule::in([HocKy::UPCOMING, HocKy::ONGOING, HocKy::CLOSED])],
        ]);

        $query = HocKy::query()
            ->when($request->filled('q'), fn ($query) => $query->where(function ($search) use ($request) {
                $term = '%'.$request->input('q').'%';
                $search->where('ma_hoc_ky', 'like', $term)->orWhere('ten_hoc_ky', 'like', $term);
            }));

        foreach (['nam_hoc', 'ky_thu', 'trang_thai'] as $truong) {
            if ($request->filled($truong)) {
                $query->where($truong, $request->input($truong));
            }
        }

        $query->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(HocKyResource::collection(
            $query->paginate($request->integer('per_page', 10))->withQueryString(),
        ));
    }

    public function store(HocKyRequest $request): JsonResponse
    {
        return $this->success(new HocKyResource($this->service->tao($request->validated())), 'Tạo học kỳ thành công.', 201);
    }

    public function show(HocKy $hocKy): JsonResponse
    {
        return $this->success(new HocKyResource($hocKy));
    }

    public function update(HocKyRequest $request, HocKy $hocKy): JsonResponse
    {
        return $this->success(new HocKyResource($this->service->capNhat($hocKy, $request->validated())), 'Cập nhật học kỳ thành công.');
    }

    public function destroy(Request $request, HocKy $hocKy): JsonResponse
    {
        $this->service->xoa($hocKy, $request->user()->id);

        return $this->success(null, 'Xóa học kỳ thành công.');
    }

    public function capNhatTrangThai(TrangThaiHocKyRequest $request, HocKy $hocKy): JsonResponse
    {
        return $this->success(new HocKyResource($this->service->doiTrangThai(
            $hocKy, $request->validated('trang_thai'), $request->user()->id,
        )), 'Chuyển trạng thái học kỳ thành công.');
    }
}
