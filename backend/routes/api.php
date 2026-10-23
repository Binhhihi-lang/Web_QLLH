<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API — Laravel chỉ đóng vai trò REST API (ADR-001)
|--------------------------------------------------------------------------
| Envelope thống nhất: {success, message, data} / {success, message, ma_loi, errors}
| Auth: Bearer token Sanctum, hạn 7 ngày (ADR-004).
| Hợp đồng chi tiết: docs/04-api-contract.md
*/

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'dangNhap'])
        ->middleware('throttle:5,1')
        ->name('api/auth/login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'dangXuat'])->name('api/auth/logout');
        Route::get('me', [AuthController::class, 'toi'])->name('api/auth/me');
        Route::post('change-password', [AuthController::class, 'doiMatKhau'])
            ->name('api/auth/change-password');
    });
});

/*
| Toàn bộ endpoint còn lại yêu cầu đăng nhập và đã đổi mật khẩu lần đầu.
*/
Route::middleware(['auth:sanctum', 'doi.mat.khau'])->group(function () {
    Route::prefix('options')->group(function () {
        Route::get('subjects', [OptionController::class, 'subjects']);
        Route::get('semesters', [OptionController::class, 'semesters']);
        Route::get('teachers', [OptionController::class, 'teachers']);
        Route::get('rooms', [OptionController::class, 'rooms']);
        Route::get('admin-classes', [OptionController::class, 'adminClasses']);
        Route::get('sections', [OptionController::class, 'sections']);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
