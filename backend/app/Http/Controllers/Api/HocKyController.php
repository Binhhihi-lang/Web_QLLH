<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HocKyResource;
use App\Models\HocKy;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HocKyController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'q' => ['sometimes', 'string', 'max:255'],
            'sort_by' => ['sometimes', 'in:id,ma_hoc_ky,ten_hoc_ky,nam_hoc,ky_thu,ngay_bat_dau,ngay_ket_thuc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'nam_hoc' => ['sometimes', 'string', 'max:9'],
            'ky_thu' => ['sometimes', 'integer', 'in:1,2,3'],
            'trang_thai' => ['sometimes', 'in:UPCOMING,ONGOING,CLOSED'],
        ]);

        $query = HocKy::query()
            ->when($request->filled('q'), fn ($query) => $query->where(function ($search) use ($request) {
                $term = '%'.$request->string('q')->toString().'%';
                $search->where('ma_hoc_ky', 'like', $term)
                    ->orWhere('ten_hoc_ky', 'like', $term);
            }))
            ->when($request->filled('nam_hoc'), fn ($query) => $query->where('nam_hoc', $request->input('nam_hoc')))
            ->when($request->filled('ky_thu'), fn ($query) => $query->where('ky_thu', $request->integer('ky_thu')))
            ->when($request->filled('trang_thai'), fn ($query) => $query->where('trang_thai', $request->input('trang_thai')))
            ->orderBy($request->input('sort_by', 'id'), $request->input('sort_dir', 'asc'));

        return $this->successPhanTrang(
            HocKyResource::collection($query->paginate($request->integer('per_page', 10))->withQueryString()),
        );
    }

    public function show(HocKy $hocKy): JsonResponse
    {
        return $this->success(new HocKyResource($hocKy));
    }
}
