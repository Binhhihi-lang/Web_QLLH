<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NhatKyResource;
use App\Models\NhatKy;
use App\Services\QuanLyNhatKyService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NhatKyController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected QuanLyNhatKyService $service
    ) {}

    /**
     * GET /api/logs
     * Danh sách nhật ký hệ thống kèm phân trang và bộ lọc (ADMIN).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'nullable', 'integer', Rule::in([10, 25, 50, 100])],
            'doi_tuong_loai' => ['sometimes', 'nullable', 'string', 'max:50'],
            'hanh_dong' => ['sometimes', 'nullable', 'string', 'max:50'],
            'nguoi_thuc_hien_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'tu_ngay' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'den_ngay' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'q' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'nullable', 'string', Rule::in(['id', 'doi_tuong_loai', 'hanh_dong', 'thoi_diem'])],
            'sort_dir' => ['sometimes', 'nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $paginator = $this->service->danhSach(
            filters: $request->only([
                'doi_tuong_loai',
                'hanh_dong',
                'nguoi_thuc_hien_id',
                'tu_ngay',
                'den_ngay',
                'q',
                'sort_by',
                'sort_dir',
            ]),
            perPage: $request->integer('per_page', 10)
        );

        return $this->successPhanTrang(
            NhatKyResource::collection($paginator->withQueryString())
        );
    }

    /**
     * GET /api/logs/{nhatKy}
     * Chi tiết một bản ghi nhật ký hệ thống (ADMIN).
     */
    public function show(NhatKy $nhatKy): JsonResponse
    {
        $banGhi = $this->service->chiTiet($nhatKy);

        return $this->success(new NhatKyResource($banGhi));
    }

    /**
     * GET /api/logs/options
     * Dữ liệu danh mục cho các trường lọc trên giao diện Nhật ký (ADMIN).
     */
    public function options(): JsonResponse
    {
        $data = $this->service->danhSachOptions();

        return $this->success($data);
    }
}
