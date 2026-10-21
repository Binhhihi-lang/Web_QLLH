<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use App\Http\Middleware\CheckGioHanhChinh as CheckGioHanhChinhMiddleware;
use App\Http\Middleware\CheckVaiTro as CheckVaiTroMiddleware;
use App\Http\Middleware\CheckTaiKhoanHoatDong as CheckTaiKhoanHoatDongMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'gio.hanh.chinh' => CheckGioHanhChinhMiddleware::class,
            'vai.tro' => CheckVaiTroMiddleware::class,
            'tai.khoan.hoat.dong' => CheckTaiKhoanHoatDongMiddleware::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        // Mọi lỗi trong khu vực api/* đều trả JSON thay vì redirect.
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*'),
        );

        // Giữ đúng envelope {success, message, errors} cho API, khớp với trait ApiResponse.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy dữ liệu yêu cầu.',
                    'errors' => null,
                ], 404);
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện chức năng này.',
                    'errors' => null,
                ], 403);
            }
        });
    })->create();
