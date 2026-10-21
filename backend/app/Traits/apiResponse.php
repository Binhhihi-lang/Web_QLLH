<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;

trait ApiResponse
{
    protected function success($data = null, string $message = 'Thành công', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    /**
     * Response cho danh sách có phân trang, kèm meta và links của Laravel.
     */
    protected function successPhanTrang(ResourceCollection $collection, string $message = 'Thành công'): JsonResponse
    {
        $duLieu = $collection->response()->getData(true);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $duLieu['data'],
            'meta'    => $duLieu['meta'] ?? null,
            'links'   => $duLieu['links'] ?? null,
        ], 200);
    }

    protected function error(string $message = 'Có lỗi xảy ra', int $code = 400, $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $code);
    }
}
