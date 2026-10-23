<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * FR-01.05 — Khi must_change_password = true, chỉ cho gọi 3 endpoint:
 * GET /api/auth/me, POST /api/auth/change-password, POST /api/auth/logout.
 */
class YeuCauDoiMatKhau
{
    /**
     * Các route được phép đi qua khi còn phải đổi mật khẩu.
     *
     * @var list<string>
     */
    private const ROUTE_CHO_PHEP = [
        'api/auth/me',
        'api/auth/change-password',
        'api/auth/logout',
    ];

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $nguoiDung = $request->user();

        if ($nguoiDung === null || ! $nguoiDung->must_change_password) {
            return $next($request);
        }

        if (in_array($request->path(), self::ROUTE_CHO_PHEP, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Bạn phải đổi mật khẩu trước khi sử dụng chức năng khác.',
            'ma_loi' => 'MUST_CHANGE_PASSWORD',
            'errors' => null,
        ], 403);
    }
}
