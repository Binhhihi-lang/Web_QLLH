<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LichThiResource;
use App\Models\LichThi;
use App\Services\QuanLyLichThiService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LichThiController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyLichThiService $service) {}

    public function index(Request $request): JsonResponse
    {
        $nguoiDung = $request->user();

        if ($nguoiDung->laSinhVien()) {
            $caThi = $this->service->cuaSinhVien(
                (int) $nguoiDung->sinhVien?->id,
                $request->integer('hoc_ky_id') ?: null,
            );

            return $this->success(LichThiResource::collection($caThi));
        }

        Gate::authorize('xemDanhSach', LichThi::class);

        return $this->success(LichThiResource::collection($this->service->danhSach($request->all())));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('tao', LichThi::class);

        return $this->success(
            new LichThiResource($this->service->tao($request->all(), $request->user()->id)->load(['monHoc', 'phongHoc'])),
            'Thêm ca thi thành công.',
            201,
        );
    }

    public function update(Request $request, LichThi $lichThi): JsonResponse
    {
        Gate::authorize('tao', LichThi::class);

        return $this->success(
            new LichThiResource($this->service->sua($lichThi, $request->all(), $request->user()->id)->load(['monHoc', 'phongHoc'])),
            'Cập nhật ca thi thành công.',
        );
    }

    public function destroy(Request $request, LichThi $lichThi): JsonResponse
    {
        Gate::authorize('tao', LichThi::class);

        $this->service->xoa($lichThi, $request->user()->id);

        return $this->success(null, 'Xóa ca thi thành công.');
    }
}
