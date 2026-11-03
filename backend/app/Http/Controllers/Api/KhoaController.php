<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\KhoaRequest;
use App\Http\Resources\KhoaResource;
use App\Models\Khoa;
use App\Services\QuanLyKhoaNganhService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Danh mục Khoa (ADR-020). Xem kèm NganhController.
 */
class KhoaController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyKhoaNganhService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_khoa,ten_khoa,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $truyVan = Khoa::query()
            ->withCount('nganh')
            ->when($request->filled('q'), fn ($truyVan) => $truyVan->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_khoa', 'like', $tuKhoa)->orWhere('ten_khoa', 'like', $tuKhoa);
            }))
            ->when($request->has('trang_thai'), fn ($truyVan) => $truyVan->where('trang_thai', $request->boolean('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            KhoaResource::collection($truyVan->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(KhoaRequest $request): JsonResponse
    {
        $khoa = $this->service->taoKhoa($request->validated(), $request->user()->id);

        return $this->success(new KhoaResource($khoa), 'Tạo khoa thành công.', 201);
    }

    public function show(Khoa $khoa): JsonResponse
    {
        return $this->success(new KhoaResource($khoa->loadCount('nganh')));
    }

    public function update(KhoaRequest $request, Khoa $khoa): JsonResponse
    {
        $khoa = $this->service->capNhatKhoa($khoa, $request->validated(), $request->user()->id);

        return $this->success(new KhoaResource($khoa->loadCount('nganh')), 'Cập nhật khoa thành công.');
    }

    public function destroy(Request $request, Khoa $khoa): JsonResponse
    {
        $this->service->xoaKhoa($khoa, $request->user()->id);

        return $this->success(null, 'Xóa khoa thành công.');
    }
}
