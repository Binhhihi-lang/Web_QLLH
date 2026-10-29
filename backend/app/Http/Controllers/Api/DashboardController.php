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
}

