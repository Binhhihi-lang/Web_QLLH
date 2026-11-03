<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\NganhRequest;
use App\Http\Resources\NganhResource;
use App\Models\Nganh;
use App\Services\QuanLyKhoaNganhService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Danh mục Ngành (ADR-020). Ngành luôn thuộc một khoa.
 */
class NganhController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyKhoaNganhService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_nganh,ten_nganh,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            // Trường này cũng là tên khóa ngoại nên lọc trực tiếp được.
            'khoa_id' => ['sometimes', 'integer'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $truyVan = Nganh::query()
            ->with('khoa')
            ->when($request->filled('q'), fn ($truyVan) => $truyVan->where(function ($tim) use ($request) {
                $tuKhoa = '%'.$request->string('q')->toString().'%';
                $tim->where('ma_nganh', 'like', $tuKhoa)->orWhere('ten_nganh', 'like', $tuKhoa);
            }))
            ->when($request->filled('khoa_id'), fn ($truyVan) => $truyVan->where('khoa_id', $request->integer('khoa_id')))
            ->when($request->has('trang_thai'), fn ($truyVan) => $truyVan->where('trang_thai', $request->boolean('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            NganhResource::collection($truyVan->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(NganhRequest $request): JsonResponse
    {
        $nganh = $this->service->taoNganh($request->validated(), $request->user()->id);

        return $this->success(new NganhResource($nganh), 'Tạo ngành thành công.', 201);
    }

    public function show(Nganh $nganh): JsonResponse
    {
        return $this->success(new NganhResource($nganh->load('khoa')));
    }

    public function update(NganhRequest $request, Nganh $nganh): JsonResponse
    {
        $nganh = $this->service->capNhatNganh($nganh, $request->validated(), $request->user()->id);

        return $this->success(new NganhResource($nganh), 'Cập nhật ngành thành công.');
    }

    public function destroy(Request $request, Nganh $nganh): JsonResponse
    {
        $this->service->xoaNganh($nganh, $request->user()->id);

        return $this->success(null, 'Xóa ngành thành công.');
    }
}
