<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\HoSo\CapNhatHoSoRequest;
use App\Http\Requests\HoSo\TaiAnhDaiDienRequest;
use App\Http\Resources\NguoiDungResource;
use App\Services\CloudinaryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Hồ sơ của người dùng đang đăng nhập.
 *
 * Ảnh đại diện dùng chung cho cả 3 vai trò nên nằm trên `users`, không nằm trên
 * `sinh_vien` / `giang_vien`. ADMIN cũng đổi được (ADR-019).
 */
class HoSoController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly CloudinaryService $cloudinary) {}

    /**
     * FR-01.06 — sửa hồ sơ cá nhân. Trường nào sửa được do vai trò quyết định:
     * ADMIN sửa `name`/`email` trên `users`, giảng viên và sinh viên sửa thông tin
     * liên hệ trên hồ sơ của mình (xem CapNhatHoSoRequest).
     */
    public function capNhatHoSo(CapNhatHoSoRequest $request): JsonResponse
    {
        $nguoiDung = $request->user();
        $duLieu = $request->validated();

        DB::transaction(function () use ($nguoiDung, $duLieu) {
            $thuocTaiKhoan = Arr::only($duLieu, ['name', 'email']);

            if ($thuocTaiKhoan !== []) {
                $nguoiDung->update($thuocTaiKhoan);
            }

            $hoSo = $nguoiDung->laGiangVien() ? $nguoiDung->giangVien : $nguoiDung->sinhVien;
            $thuocHoSo = Arr::only($duLieu, ['so_dien_thoai', 'dia_chi']);

            if ($hoSo !== null && $thuocHoSo !== []) {
                $hoSo->update($thuocHoSo);
            }
        });

        return $this->success(
            new NguoiDungResource($nguoiDung->fresh()->load(['sinhVien', 'giangVien'])),
            'Cập nhật hồ sơ thành công.',
        );
    }

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
