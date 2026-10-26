<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\BulkRequest;
use App\Http\Requests\QuanLy\PhongHocRequest;
use App\Http\Requests\QuanLy\TrangThaiRequest;
use App\Http\Resources\PhongHocResource;
use App\Models\PhongHoc;
use App\Services\QuanLyPhongHocService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhongHocController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyPhongHocService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_phong,ten_phong,suc_chua,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
        ]);

        $query = PhongHoc::query()
            ->when($request->filled('q'), fn ($query) => $query->where(function ($search) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $search->where('ma_phong', 'like', $term)
                    ->orWhere('ten_phong', 'like', $term);
            }))
            ->when($request->has('trang_thai'), fn ($query) => $query->where(
                'trang_thai',
                $request->boolean('trang_thai'),
            ))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            PhongHocResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(PhongHocRequest $request): JsonResponse
    {
        return $this->success(
            new PhongHocResource(PhongHoc::query()->create($request->validated())),
            'Tạo phòng học thành công.',
            201,
        );
    }

    public function show(PhongHoc $phongHoc): JsonResponse
    {
        return $this->success(new PhongHocResource($phongHoc));
    }

    public function update(PhongHocRequest $request, PhongHoc $phongHoc): JsonResponse
    {
        $phongHoc->update($request->validated());

        return $this->success(new PhongHocResource($phongHoc->fresh()), 'Cập nhật phòng học thành công.');
    }

    public function destroy(Request $request, PhongHoc $phongHoc): JsonResponse
    {
        $this->service->xoa($phongHoc, $request->user()->id);

        return $this->success(null, 'Xóa phòng học thành công.');
    }

    public function capNhatTrangThai(TrangThaiRequest $request, PhongHoc $phongHoc): JsonResponse
    {
        $phongHoc->update(['trang_thai' => $request->boolean('trang_thai')]);

        return $this->success(new PhongHocResource($phongHoc->fresh()), 'Cập nhật trạng thái thành công.');
    }

    public function capNhatTrangThaiHangLoat(BulkRequest $request): JsonResponse
    {
        return $this->phanHoiKetQuaHangLoat($this->service->doiTrangThaiHangLoat(
            $request->validated('ids'),
            $request->boolean('trang_thai'),
        ));
    }

    public function xoaHangLoat(BulkRequest $request): JsonResponse
    {
        return $this->phanHoiKetQuaHangLoat($this->service->xoaHangLoat(
            $request->validated('ids'),
            $request->user()->id,
        ));
    }

    private function phanHoiKetQuaHangLoat(array $chiTiet): JsonResponse
    {
        $thanhCong = count(array_filter($chiTiet, fn ($row) => $row['ket_qua'] === 'THANH_CONG'));

        return $this->success([
            'thanh_cong' => $thanhCong,
            'that_bai' => count($chiTiet) - $thanhCong,
            'chi_tiet' => $chiTiet,
        ], 'Đã xử lý '.count($chiTiet).' bản ghi.');
    }
}
