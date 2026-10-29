<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ThungRacService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ThungRacController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ThungRacService $service) {}

    /**
     * Danh sách bản ghi trong thùng rác theo loại thực thể (SCR-45).
     * Endpoint: GET /api/trash/{type}
     */
    public function index(Request $request, string $type): JsonResponse
    {
        try {
            $paginator = $this->service->danhSach($type, $request);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách thùng rác thành công.',
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'from' => $paginator->firstItem(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
                'links' => [
                    'first' => $paginator->url(1),
                    'last' => $paginator->url($paginator->lastPage()),
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                ],
            ], 200);
        } catch (NotFoundHttpException $e) {
            return $this->error($e->getMessage(), 404, 'NOT_FOUND');
        }
    }

    /**
     * Khôi phục bản ghi từ thùng rác.
     * Endpoint: POST /api/trash/{type}/{id}/restore
     */
    public function restore(Request $request, string $type, int $id): JsonResponse
    {
        try {
            /** @var \App\Models\User $user */
            $user = $request->user();
            $record = $this->service->khoiPhuc($type, $id, $user);

            return $this->success($record, 'Khôi phục bản ghi thành công.');
        } catch (NotFoundHttpException $e) {
            return $this->error($e->getMessage(), 404, 'NOT_FOUND');
        } catch (HttpException $e) {
            $maLoi = $e->getStatusCode() === 409 ? 'RESTORE_PARENT_DELETED' : null;

            return $this->error($e->getMessage(), $e->getStatusCode(), $maLoi);
        }
    }
}

