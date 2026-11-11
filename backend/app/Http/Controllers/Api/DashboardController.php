<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly DashboardService $service) {}

    /**
     * Dashboard cho ADMIN (SCR-03).
     * Endpoint: GET /api/dashboard/admin
     */
    public function admin(Request $request): JsonResponse
    {
        $data = $this->service->layThongKeAdmin();

        return $this->success($data, 'Tải số liệu dashboard thành công.');
    }

    /**
     * Dashboard cho GIANG_VIEN (SCR-04).
     * Endpoint: GET /api/dashboard/teacher?hoc_ky_id=
     */
    public function teacher(Request $request): JsonResponse
    {
        $data = $this->service->layThongKeGiangVien($request->user(), $this->hocKyId($request));

        return $this->success($data, 'Tải số liệu dashboard thành công.');
    }

    /**
     * Dashboard cho SINH_VIEN (SCR-05).
     * Endpoint: GET /api/dashboard/student?hoc_ky_id=
     */
    public function student(Request $request): JsonResponse
    {
        $data = $this->service->layThongKeSinhVien($request->user(), $this->hocKyId($request));

        return $this->success($data, 'Tải số liệu dashboard thành công.');
    }

    /**
     * `?hoc_ky_id=` tuỳ chọn — không truyền thì service tự chọn kỳ mặc định (§14a).
     */
    private function hocKyId(Request $request): ?int
    {
        return $request->filled('hoc_ky_id') ? $request->integer('hoc_ky_id') : null;
    }
}

