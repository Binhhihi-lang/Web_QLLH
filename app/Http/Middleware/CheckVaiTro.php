<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn truy cập theo vai trò.
 *
 * Cách dùng trong route:
 *   ->middleware('vai.tro:admin')          // chỉ admin
 *   ->middleware('vai.tro:admin,giang_vien') // cả hai vai trò
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

        // Chưa đăng nhập: đẩy về trang đăng nhập.
        if ($nguoiDung === null) {
            return redirect()->route('login');
        }

        if (! in_array($nguoiDung->vai_tro, $vaiTro, true)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện chức năng này.',
                ], 403);
            }

            abort(403, 'Bạn không có quyền truy cập trang này.');
        }

        return $next($request);
    }
}
