<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckGioHanhChinh
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

        $gioHienTai = now()->hour;
        $gioBatDau = 8;
        $gioKetThuc = 17;

        if ($gioHienTai < $gioBatDau || $gioHienTai >= $gioKetThuc) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn chỉ được thực hiện các thao tác trong giờ hành chính',
            ], 400);
        }
        return $next($request);
    }
}
