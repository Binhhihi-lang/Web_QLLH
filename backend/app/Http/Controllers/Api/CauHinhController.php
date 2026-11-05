<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QuanLyCauHinhService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CauHinhController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyCauHinhService $service) {}

    public function index(Request $request): JsonResponse
    {
        $hocKyId = $request->integer('hoc_ky_id') ?: null;
        return $this->success($this->service->danhSach($hocKyId));
    }

    public function semesters(): JsonResponse
    {
        return $this->success($this->service->danhSachHocKy());
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success(
            $this->service->capNhat($request->all()),
            'Cập nhật cấu hình thành công.',
        );
    }
}
