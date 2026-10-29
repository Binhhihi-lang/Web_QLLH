<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CauHinhController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ThungRacController;
use App\Http\Controllers\Api\GiangVienController;
use App\Http\Controllers\Api\HoSoController;
use App\Http\Controllers\Api\LopHanhChinhController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\MonHocController;
use App\Http\Controllers\Api\OptionController;
use App\Http\Controllers\Api\PhongHocController;
use App\Http\Controllers\Api\SinhVienController;
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
    // FR-01.10 / FR-01.11 — ảnh đại diện, dùng chung cho cả 3 vai trò
    Route::post('/me/avatar', [HoSoController::class, 'taiAnhDaiDien'])->name('api/me/avatar');
    Route::delete('/me/avatar', [HoSoController::class, 'xoaAnhDaiDien'])->name('api/me/avatar/xoa');

    Route::prefix('options')->group(function () {
        Route::get('subjects', [OptionController::class, 'subjects']);
        Route::get('semesters', [OptionController::class, 'semesters']);
        Route::get('teachers', [OptionController::class, 'teachers']);
        Route::get('rooms', [OptionController::class, 'rooms']);
        Route::get('admin-classes', [OptionController::class, 'adminClasses']);
        Route::get('sections', [OptionController::class, 'sections']);
    });

    Route::get('/menus', [MenuController::class, 'index'])->name('api/menus');
    Route::middleware('vai.tro:ADMIN')->group(function () {
        Route::post('/menus', [MenuController::class, 'store'])->name('api/menus/tao');
        Route::get('/menus/{menu}', [MenuController::class, 'show'])->name('api/menus/chi-tiet');
        Route::put('/menus/{menu}', [MenuController::class, 'update'])->name('api/menus/cap-nhat');
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->name('api/menus/xoa');
        Route::get('/settings', [CauHinhController::class, 'index'])->name('api/settings');
        Route::put('/settings', [CauHinhController::class, 'update'])->name('api/settings/cap-nhat');
        Route::get('/dashboard/admin', [DashboardController::class, 'admin'])->name('api/dashboard/admin');
        Route::get('/trash/{type}', [ThungRacController::class, 'index'])->name('api/trash/danh-sach');
        Route::post('/trash/{type}/{id}/restore', [ThungRacController::class, 'restore'])->name('api/trash/khoi-phuc');
    });

    Route::prefix('subjects')->group(function () {
        Route::get('/', [MonHocController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [MonHocController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::patch('bulk-status', [MonHocController::class, 'capNhatTrangThaiHangLoat'])->middleware('vai.tro:ADMIN');
        Route::post('bulk-delete', [MonHocController::class, 'xoaHangLoat'])->middleware('vai.tro:ADMIN');
        Route::get('{monHoc}', [MonHocController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::put('{monHoc}', [MonHocController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{monHoc}', [MonHocController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::patch('{monHoc}/status', [MonHocController::class, 'capNhatTrangThai'])->middleware('vai.tro:ADMIN');
    });

    Route::prefix('rooms')->group(function () {
        Route::get('/', [PhongHocController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::post('/', [PhongHocController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::patch('bulk-status', [PhongHocController::class, 'capNhatTrangThaiHangLoat'])->middleware('vai.tro:ADMIN');
        Route::post('bulk-delete', [PhongHocController::class, 'xoaHangLoat'])->middleware('vai.tro:ADMIN');
        Route::get('{phongHoc}', [PhongHocController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::put('{phongHoc}', [PhongHocController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{phongHoc}', [PhongHocController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::patch('{phongHoc}/status', [PhongHocController::class, 'capNhatTrangThai'])->middleware('vai.tro:ADMIN');
    });

    Route::prefix('students')->group(function () {
        Route::get('/', [SinhVienController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::post('/', [SinhVienController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::patch('bulk-status', [SinhVienController::class, 'capNhatTrangThaiHangLoat'])->middleware('vai.tro:ADMIN');
        Route::post('bulk-delete', [SinhVienController::class, 'xoaHangLoat'])->middleware('vai.tro:ADMIN');
        Route::get('{sinhVien}', [SinhVienController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::put('{sinhVien}', [SinhVienController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{sinhVien}', [SinhVienController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::patch('{sinhVien}/status', [SinhVienController::class, 'capNhatTrangThai'])->middleware('vai.tro:ADMIN');
    });

    Route::prefix('teachers')->group(function () {
        Route::get('/', [GiangVienController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [GiangVienController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::patch('bulk-status', [GiangVienController::class, 'capNhatTrangThaiHangLoat'])->middleware('vai.tro:ADMIN');
        Route::post('bulk-delete', [GiangVienController::class, 'xoaHangLoat'])->middleware('vai.tro:ADMIN');
        Route::get('{giangVien}', [GiangVienController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::put('{giangVien}', [GiangVienController::class, 'update'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::delete('{giangVien}', [GiangVienController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::patch('{giangVien}/status', [GiangVienController::class, 'capNhatTrangThai'])->middleware('vai.tro:ADMIN');
    });

    Route::prefix('admin-classes')->group(function () {
        Route::get('/', [LopHanhChinhController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [LopHanhChinhController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::get('{lopHanhChinh}', [LopHanhChinhController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::put('{lopHanhChinh}', [LopHanhChinhController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{lopHanhChinh}', [LopHanhChinhController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::get('{lopHanhChinh}/students', [LopHanhChinhController::class, 'danhSachSinhVien'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::post('{lopHanhChinh}/students', [LopHanhChinhController::class, 'ganSinhVien'])->middleware('vai.tro:ADMIN');
        Route::delete('{lopHanhChinh}/students/{sinhVien}', [LopHanhChinhController::class, 'goSinhVien'])->middleware('vai.tro:ADMIN');
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
