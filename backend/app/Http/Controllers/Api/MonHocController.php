<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\BulkRequest;
use App\Http\Requests\QuanLy\MonHocRequest;
use App\Http\Requests\QuanLy\TrangThaiRequest;
use App\Http\Resources\MonHocResource;
use App\Models\MonHoc;
use App\Services\QuanLyMonHocService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonHocController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyMonHocService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_mon,ten_mon,so_tin_chi,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'trang_thai' => ['sometimes', 'in:true,false,1,0'],
            'so_tin_chi' => ['sometimes', 'integer', 'between:1,10'],
        ]);

        $query = MonHoc::query()
            ->when($request->filled('q'), fn ($query) => $query->where(function ($search) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $search->where('ma_mon', 'like', $term)
                    ->orWhere('ten_mon', 'like', $term);
            }))
            ->when($request->has('trang_thai'), fn ($query) => $query->where(
                'trang_thai',
                $request->boolean('trang_thai'),
            ))
            ->when($request->has('so_tin_chi'), fn ($query) => $query->where(
                'so_tin_chi',
                $request->integer('so_tin_chi'),
            ))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            MonHocResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function store(MonHocRequest $request): JsonResponse
    {
        return $this->success(
            new MonHocResource(MonHoc::query()->create($request->validated())),
            'Tạo môn học thành công.',
            201,
        );
    }

    public function show(MonHoc $monHoc): JsonResponse
    {
        return $this->success(new MonHocResource($monHoc));
    }

    public function update(MonHocRequest $request, MonHoc $monHoc): JsonResponse
    {
        $monHoc->update($request->validated());

        return $this->success(new MonHocResource($monHoc->fresh()), 'Cập nhật môn học thành công.');
    }

    public function destroy(Request $request, MonHoc $monHoc): JsonResponse
    {
        $this->service->xoa($monHoc, $request->user()->id);

        return $this->success(null, 'Xóa môn học thành công.');
    }

    public function capNhatTrangThai(TrangThaiRequest $request, MonHoc $monHoc): JsonResponse
    {
        $monHoc->update(['trang_thai' => $request->boolean('trang_thai')]);

        return $this->success(new MonHocResource($monHoc->fresh()), 'Cập nhật trạng thái thành công.');
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
