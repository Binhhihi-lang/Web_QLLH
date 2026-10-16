<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LopHocController;
use App\Http\Controllers\Api\SinhVienController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| API quản lý lớp học và sinh viên
|--------------------------------------------------------------------------
| gio.hanh.chinh : chỉ cho thao tác trong giờ hành chính (8h - 17h)
|
| Lưu ý: hiện API chưa yêu cầu đăng nhập. Muốn bảo vệ, thêm 'auth:sanctum'
| vào middleware bên dưới sau khi có endpoint cấp token.
*/

Route::middleware('gio.hanh.chinh')->group(function () {
    Route::apiResource('lop-hoc', LopHocController::class);
    Route::apiResource('sinh-vien', SinhVienController::class);
});
