<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuanLy\NhapDiemDonRequest;
use App\Models\DangKyHocPhan;
use App\Services\QuanLyDiemService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiemController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly QuanLyDiemService $diemService) {}

    /**
     * PUT /api/enrollments/{dangKyHocPhan}/grade
     * Nhập hoặc sửa điểm cho một sinh viên trong lớp học phần.
     */
    public function nhapDiemDon(NhapDiemDonRequest $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $dongDiem = $this->diemService->nhapDiemDon(
            $dangKyHocPhan,
            $request->validated(),
            $request->user(),
            $request->input('ly_do'),
        );

        return $this->success($dongDiem, 'Cập nhật điểm thành công.');
    }

    /**
     * GET /api/enrollments/{dangKyHocPhan}/grade-history
     * Xem lịch sử sửa điểm của một đăng ký học phần.
     */
    public function lichSuDiem(Request $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $lichSu = $this->diemService->lichSuDiem($dangKyHocPhan, $request->user());

        return $this->success($lichSu);
    }

    /**
     * GET /api/me/grades
     * Sinh viên xem điểm các môn và GPA theo học kỳ.
     */
    public function diemCuaToi(Request $request): JsonResponse
    {
        $hocKyId = $request->has('hoc_ky_id') ? $request->integer('hoc_ky_id') : null;
        $data = $this->diemService->diemCuaToi($request->user(), $hocKyId);

        return $this->success($data);
    }

    /**
     * GET /api/me/gpa
     * Sinh viên xem GPA học kỳ hiện tại và CPA tích lũy.
     */
    public function gpaCuaToi(Request $request): JsonResponse
    {
        $data = $this->diemService->gpaCuaToi($request->user());

        return $this->success($data);
    }
}

