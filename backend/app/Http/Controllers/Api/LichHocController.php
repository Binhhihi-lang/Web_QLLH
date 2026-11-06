<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LichHoc\LichHocRequest;
use App\Http\Resources\LichHocResource;
use App\Models\BuoiHoc;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class LichHocController extends Controller
{
    use ApiResponseTrait;

    public function index(LichHocRequest $request): JsonResponse
    {
        $query = BuoiHoc::query()->whereHas('lopHocPhan')
            ->with([
                'lopHocPhan.monHoc' => fn ($query) => $query->withTrashed(),
                'lopHocPhan.hocKy' => fn ($query) => $query->withTrashed(),
                'lopHocPhan.giangVien' => fn ($query) => $query->withTrashed(),
                'phongHoc' => fn ($query) => $query->withTrashed(),
            ]);

        if ($request->user()->laGiangVien()) {
            $id = $request->user()->giangVien?->id ?? 0;
            $query->whereHas('lopHocPhan', fn ($query) => $query->where('giang_vien_id', $id));
        } elseif ($request->user()->laSinhVien()) {
            $id = $request->user()->sinhVien?->id ?? 0;
            $query->whereHas('lopHocPhan.dangKyHocPhan', fn ($query) => $query->dangHieuLuc()->where('sinh_vien_id', $id));
        }

        foreach (['hoc_ky_id', 'giang_vien_id'] as $truong) {
            if ($request->filled($truong)) {
                $query->whereHas('lopHocPhan', fn ($query) => $query->where($truong, $request->integer($truong)));
            }
        }

        foreach (['phong_hoc_id', 'trang_thai'] as $truong) {
            if ($request->filled($truong)) {
                $query->where($truong, $request->input($truong));
            }
        }

        $query->when($request->filled('tu_ngay'), fn ($query) => $query->whereDate('ngay_hoc', '>=', $request->input('tu_ngay')))
            ->when($request->filled('den_ngay'), fn ($query) => $query->whereDate('ngay_hoc', '<=', $request->input('den_ngay')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        if ($request->input('sort_by', 'id') !== 'id') {
            $query->orderBy('id');
        }

        return $this->successPhanTrang(LichHocResource::collection(
            $query->paginate($request->integer('per_page', 10))->withQueryString(),
        ));
    }
}
