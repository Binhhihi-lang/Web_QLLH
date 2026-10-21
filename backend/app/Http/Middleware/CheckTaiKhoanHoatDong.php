<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chặn tài khoản đã bị khóa (trang_thai = false) đang giữ session cũ.
 */
class CheckTaiKhoanHoatDong
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $nguoiDung = $request->user();

        if ($nguoiDung !== null && ! $nguoiDung->trang_thai) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tài khoản của bạn đã bị khóa.',
                ], 403);
            }

            return redirect()->route('login')
                ->withErrors(['email' => 'Tài khoản của bạn đã bị khóa.']);
        }

        return $next($request);
    }
}
