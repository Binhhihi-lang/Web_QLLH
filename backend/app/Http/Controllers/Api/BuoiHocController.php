<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BuoiHocResource;
use App\Models\BuoiHoc;
use App\Models\LopHocPhan;
use App\Services\QuanLyBuoiHocService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BuoiHocController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyBuoiHocService $service) {}

    public function index(LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('xemBuoiHoc', $lopHocPhan);

        $buoi = $lopHocPhan->buoiHoc()
            ->with('phongHoc')
            ->withCount('diemDanh')
            ->orderBy('ngay_hoc')
            ->orderBy('gio_bat_dau')
            ->get();

        return $this->success(BuoiHocResource::collection($buoi));
    }

    public function store(Request $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('quanLyBuoiHoc', $lopHocPhan);

        $buoi = $this->service->tao($lopHocPhan, $request->all(), $request->user()->id);

        return $this->success(
            new BuoiHocResource($buoi->load('phongHoc')),
            'Thêm buổi học thành công.',
            201,
        );
    }

    public function generate(Request $request, LopHocPhan $lopHocPhan): JsonResponse
    {
        Gate::authorize('quanLyBuoiHoc', $lopHocPhan);

        $daTao = $this->service->sinhLich($lopHocPhan, $request->all(), $request->user()->id);
        $daTao->load('phongHoc');

        return $this->success(
            BuoiHocResource::collection($daTao),
            'Đã tạo '.$daTao->count().' buổi học.',
            201,
        );
    }

    public function update(Request $request, BuoiHoc $buoiHoc): JsonResponse
    {
        Gate::authorize('quanLyBuoiHoc', $buoiHoc->lopHocPhan);

        $buoi = $this->service->sua(
            $buoiHoc,
            $request->all(),
            $request->boolean('xac_nhan'),
            $request->user()->id,
        );

        return $this->success(new BuoiHocResource($buoi->load('phongHoc')), 'Cập nhật buổi học thành công.');
    }

    public function capNhatTrangThai(Request $request, BuoiHoc $buoiHoc): JsonResponse
    {
        Gate::authorize('quanLyBuoiHoc', $buoiHoc->lopHocPhan);

        $duLieu = $request->validate([
            'trang_thai' => ['required', 'in:CANCELLED,SCHEDULED'],
            'ly_do_huy' => ['nullable', 'string', 'max:255'],
        ]);

        $buoi = $duLieu['trang_thai'] === BuoiHoc::CANCELLED
            ? $this->service->huy($buoiHoc, $duLieu['ly_do_huy'] ?? null, $request->boolean('xac_nhan'), $request->user()->id)
            : $this->service->moLai($buoiHoc, $request->user()->id);

        return $this->success(new BuoiHocResource($buoi->load('phongHoc')), 'Cập nhật trạng thái buổi học thành công.');
    }

    public function destroy(Request $request, BuoiHoc $buoiHoc): JsonResponse
    {
        Gate::authorize('quanLyBuoiHoc', $buoiHoc->lopHocPhan);

        $this->service->xoa($buoiHoc, $request->boolean('xac_nhan'), $request->user()->id);

        return $this->success(null, 'Xóa buổi học thành công.');
    }
}
