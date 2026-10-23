<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn tài khoản đã bị khóa hoặc đã bị xóa mềm khi đang giữ token hợp lệ.
 * Khi phát hiện, thu hồi toàn bộ token của tài khoản đó (ADR-004).
 */
class CheckTaiKhoanHoatDong
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $nguoiDung = $request->user();

        if ($nguoiDung !== null && (! $nguoiDung->trang_thai || $nguoiDung->trashed())) {
            $nguoiDung->tokens()->delete();

            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn đã bị khóa.',
                'ma_loi' => 'ACCOUNT_LOCKED',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
