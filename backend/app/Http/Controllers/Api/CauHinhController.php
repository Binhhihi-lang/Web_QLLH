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

    public function index(): JsonResponse
    {
        return $this->success($this->service->danhSach());
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success(
            $this->service->capNhat($request->all()),
            'Cập nhật cấu hình thành công.',
        );
    }
}
