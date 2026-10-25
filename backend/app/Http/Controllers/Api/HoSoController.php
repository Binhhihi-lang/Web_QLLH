<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HoSo\TaiAnhDaiDienRequest;
use App\Http\Resources\NguoiDungResource;
use App\Services\CloudinaryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ảnh đại diện của người dùng đang đăng nhập (ADR-019).
 *
 * Ảnh dùng chung cho cả 3 vai trò nên nằm trên `users`, không nằm trên
 * `sinh_vien` / `giang_vien`. ADMIN cũng đổi được.
 */
class HoSoController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly CloudinaryService $cloudinary) {}

    /**
     * FR-01.10 — Tải ảnh đại diện lên Cloudinary, thay ảnh cũ nếu có.
     */
    public function taiAnhDaiDien(TaiAnhDaiDienRequest $request): JsonResponse
    {
        $nguoiDung = $request->user();
        $anhCu = $nguoiDung->avatar_public_id;

        $ketQua = $this->cloudinary->uploadAvatar($request->file('anh'));

        $nguoiDung->update([
            'avatar_url' => $ketQua['url'],
            'avatar_public_id' => $ketQua['public_id'],
        ]);

        // Chỉ xóa ảnh cũ SAU khi DB đã ghi ảnh mới — nếu upload thành công mà
        // update lỗi thì vẫn còn ảnh cũ dùng được.
        if (filled($anhCu) && $anhCu !== $ketQua['public_id']) {
            $this->cloudinary->xoaAvatar($anhCu);
        }

        return $this->success(new NguoiDungResource($nguoiDung), 'Cập nhật ảnh đại diện thành công.');
    }

    /**
     * FR-01.11 — Gỡ ảnh đại diện, quay về ảnh mặc định (chữ cái đầu tên).
     */
    public function xoaAnhDaiDien(Request $request): JsonResponse
    {
        $nguoiDung = $request->user();

        $this->cloudinary->xoaAvatar($nguoiDung->avatar_public_id);

        $nguoiDung->update([
            'avatar_url' => null,
            'avatar_public_id' => null,
        ]);

        return $this->success(new NguoiDungResource($nguoiDung), 'Đã gỡ ảnh đại diện.');
    }
}
