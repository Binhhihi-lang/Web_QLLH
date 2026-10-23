<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\LoiNghiepVu;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\DangNhapRequest;
use App\Http\Requests\Auth\DoiMatKhauRequest;
use App\Http\Resources\NguoiDungResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * FR-01.01 — Đăng nhập, trả Bearer token Sanctum hạn 7 ngày.
     */
    public function dangNhap(DangNhapRequest $request): JsonResponse
    {
        $nguoiDung = User::query()
            ->where('email', $request->validated('email'))
            ->first();

        if ($nguoiDung === null || ! Hash::check($request->validated('password'), $nguoiDung->password)) {
            throw new LoiNghiepVu('AUTH_INVALID', 'Email hoặc mật khẩu không đúng.', 401);
        }

        if (! $nguoiDung->trang_thai) {
            throw new LoiNghiepVu('ACCOUNT_LOCKED', 'Tài khoản của bạn đã bị khóa.', 403);
        }

        $token = $nguoiDung->createToken('spa')->plainTextToken;
        $hanPhut = (int) config('sanctum.expiration');

        return $this->success([
            'token' => $token,
            'het_han_luc' => now()->addMinutes($hanPhut)->format('Y-m-d H:i:s'),
            'nguoi_dung' => new NguoiDungResource($nguoiDung),
        ], 'Đăng nhập thành công.');
    }

    /**
     * FR-01.02 — Thu hồi token hiện tại.
     */
    public function dangXuat(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Đăng xuất thành công.');
    }

    /**
     * Trả thông tin người dùng đang đăng nhập kèm hồ sơ.
     */
    public function toi(Request $request): JsonResponse
    {
        return $this->success(new NguoiDungResource($request->user()->load(['sinhVien', 'giangVien'])));
    }

    /**
     * FR-01.05 — Đổi mật khẩu, phải nhập mật khẩu cũ. Thu hồi mọi token khác.
     */
    public function doiMatKhau(DoiMatKhauRequest $request): JsonResponse
    {
        $nguoiDung = $request->user();

        if (! Hash::check($request->validated('mat_khau_cu'), $nguoiDung->password)) {
            throw new LoiNghiepVu(
                'VALIDATION_ERROR',
                'Dữ liệu không hợp lệ.',
                422,
                ['mat_khau_cu' => ['Mật khẩu cũ không đúng.']],
            );
        }

        $nguoiDung->update([
            'password' => $request->validated('password'),
            'must_change_password' => false,
        ]);

        // Giữ token hiện tại, thu hồi các phiên đăng nhập khác.
        $tokenHienTai = $request->user()->currentAccessToken();
        $nguoiDung->tokens()->where('id', '!=', $tokenHienTai->id)->delete();

        return $this->success(null, 'Đổi mật khẩu thành công.');
    }
}
