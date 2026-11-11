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
        $duLieu = $this->service->danhSach($hocKyId);

        // `danhSach()` đọc toàn bộ bảng `cau_hinh`, có thể chứa khoá vận hành chỉ
        // dành cho ADMIN. Người dùng không phải ADMIN chỉ nhận khoá `diem.*` —
        // whitelist theo tiền tố, không phải blacklist, để khoá mới thêm sau này
        // mặc định không lộ.
        if (! $request->user()->laAdmin()) {
            $duLieu = array_filter(
                $duLieu,
                fn (string $khoa) => str_starts_with($khoa, 'diem.'),
                ARRAY_FILTER_USE_KEY,
            );
        }

        return $this->success($duLieu);
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
