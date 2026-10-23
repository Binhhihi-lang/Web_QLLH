<?php

use App\Http\Controllers\Api\OptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API — Laravel chỉ đóng vai trò REST API (ADR-001)
|--------------------------------------------------------------------------
| Envelope thống nhất: {success, message, data} / {success, message, ma_loi, errors}
| Auth: Bearer token Sanctum (ADR-004). Hợp đồng chi tiết: docs/04-api-contract.md
*/

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
})->middleware('auth:sanctum');
