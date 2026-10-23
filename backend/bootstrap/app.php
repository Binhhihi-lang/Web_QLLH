<?php

use App\Exceptions\LoiNghiepVu;
use App\Http\Middleware\CheckGioHanhChinh as CheckGioHanhChinhMiddleware;
use App\Http\Middleware\CheckTaiKhoanHoatDong as CheckTaiKhoanHoatDongMiddleware;
use App\Http\Middleware\CheckVaiTro as CheckVaiTroMiddleware;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        // Backend không còn trang đăng nhập (ADR-001) — khách vào api/* phải
        // nhận 401 JSON thay vì bị redirect tới route login không tồn tại.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/');

        $middleware->alias([
            'gio.hanh.chinh' => CheckGioHanhChinhMiddleware::class,
            'vai.tro' => CheckVaiTroMiddleware::class,
            'tai.khoan.hoat.dong' => CheckTaiKhoanHoatDongMiddleware::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        // Mọi lỗi trong khu vực api/* đều trả JSON thay vì redirect.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (LoiNghiepVu $e, Request $request) {
            if ($request->is('api/*')) {
                return $e->render();
            }
        });

        // 422 — lỗi validate theo trường.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ.',
                    'ma_loi' => 'VALIDATION_ERROR',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // 401 — chưa đăng nhập hoặc token hết hạn.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chưa đăng nhập hoặc phiên đã hết hạn.',
                    'ma_loi' => 'UNAUTHENTICATED',
                    'errors' => null,
                ], 401);
            }
        });

        // 403 — Policy/Gate từ chối.
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện chức năng này.',
                    'ma_loi' => 'FORBIDDEN',
                    'errors' => null,
                ], 403);
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện chức năng này.',
                    'ma_loi' => 'FORBIDDEN',
                    'errors' => null,
                ], 403);
            }
        });

        // 404 — không tìm thấy route hoặc bản ghi.
        $exceptions->render(function (NotFoundHttpException|ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy dữ liệu yêu cầu.',
                    'ma_loi' => 'NOT_FOUND',
                    'errors' => null,
                ], 404);
            }
        });

        // 429 — quá giới hạn đăng nhập.
        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',
                    'ma_loi' => 'TOO_MANY_REQUESTS',
                    'errors' => null,
                ], 429);
            }
        });

        // Mọi lỗi HTTP còn lại trong api/* vẫn giữ envelope thống nhất.
        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Có lỗi xảy ra.',
                    'ma_loi' => match ($e->getStatusCode()) {
                        403 => 'FORBIDDEN',
                        404 => 'NOT_FOUND',
                        429 => 'TOO_MANY_REQUESTS',
                        default => null,
                    },
                    'errors' => null,
                ], $e->getStatusCode());
            }
        });
    })->create();
