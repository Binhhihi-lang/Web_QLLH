<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn truy cập theo vai trò.
 *
 * Cách dùng trong route:
 *   ->middleware('vai.tro:ADMIN')                    // chỉ quản trị viên
 *   ->middleware('vai.tro:ADMIN,GIANG_VIEN')         // cả hai vai trò
 */
class CheckVaiTro
{
    /**
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$vaiTro  Danh sách vai trò được phép
     */
    public function handle(Request $request, Closure $next, string ...$vaiTro): Response
    {
        $nguoiDung = $request->user();

        if ($nguoiDung === null) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa đăng nhập hoặc phiên đã hết hạn.',
                'ma_loi' => 'UNAUTHENTICATED',
                'errors' => null,
            ], 401);
        }

        if (! in_array($nguoiDung->vai_tro, $vaiTro, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền thực hiện chức năng này.',
                'ma_loi' => 'FORBIDDEN',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
