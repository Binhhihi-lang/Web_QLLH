<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DiemDanh\DiemDanhHangLoatRequest;
use App\Models\BuoiHoc;
use App\Services\QuanLyDiemDanhService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiemDanhController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        protected QuanLyDiemDanhService $service
    ) {}

    /**
     * GET /api/sessions/{buoiHoc}/attendance
     * Danh sách sinh viên và trạng thái điểm danh của buổi học.
     */
    public function danhSach(BuoiHoc $buoiHoc, Request $request): JsonResponse
    {
        $data = $this->service->layDanhSachDiemDanh($buoiHoc, $request->user());

        return $this->success($data);
    }

    /**
     * PUT /api/sessions/{buoiHoc}/attendance
     * Điểm danh hàng loạt cho buổi học.
     */
    public function luu(BuoiHoc $buoiHoc, DiemDanhHangLoatRequest $request): JsonResponse
    {
        $data = $this->service->luuDiemDanh($buoiHoc, $request->validated('diem_danh'), $request->user());

        return $this->success($data, 'Lưu điểm danh thành công.');
    }

    /**
     * GET /api/me/attendance
     * Sinh viên xem lịch sử điểm danh của bản thân theo buổi học.
     */
    public function cuaToi(Request $request): JsonResponse
    {
        $request->validate([
            'hoc_ky_id' => ['sometimes', 'nullable', 'integer', 'exists:hoc_ky,id'],
            'lop_hoc_phan_id' => ['sometimes', 'nullable', 'integer', 'exists:lop_hoc_phan,id'],
            'mon_hoc_id' => ['sometimes', 'nullable', 'integer', 'exists:mon_hoc,id'],
            'per_page' => ['sometimes', 'nullable', 'integer', Rule::in([10, 25, 50, 100])],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        $paginator = $this->service->diemDanhCuaToi(
            user: $request->user(),
            hocKyId: $request->filled('hoc_ky_id') ? $request->integer('hoc_ky_id') : null,
            lopHocPhanId: $request->filled('lop_hoc_phan_id') ? $request->integer('lop_hoc_phan_id') : null,
            monHocId: $request->filled('mon_hoc_id') ? $request->integer('mon_hoc_id') : null,
            perPage: $request->integer('per_page', 10),
        );

        return response()->json([
            'success' => true,
            'message' => 'Thành công',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'path' => $paginator->path(),
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
    }

    /**
     * GET /api/me/attendance-summary
     * Sinh viên xem thống kê chuyên cần theo từng lớp học phần.
     */
    public function thongKeCuaToi(Request $request): JsonResponse
    {
        $request->validate([
            'hoc_ky_id' => ['sometimes', 'nullable', 'integer', 'exists:hoc_ky,id'],
        ]);

        $data = $this->service->thongKeCuaToi(
            user: $request->user(),
            hocKyId: $request->filled('hoc_ky_id') ? $request->integer('hoc_ky_id') : null,
        );

        return $this->success($data);
    }
}
