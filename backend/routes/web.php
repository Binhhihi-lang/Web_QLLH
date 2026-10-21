<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\SinhVienController;
use App\Http\Controllers\LopHocController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\NguoiDungController;
use App\Http\Controllers\TaiKhoanController;

/*
|--------------------------------------------------------------------------
| Trang công khai
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('lophoc.index')
        : redirect()->route('login');
})->name('home');

Route::get('/gioi-thieu', function () {
    return '<h1>Đây là trang Giới thiệu</h1><p>Nội dung tùy ý ở đây</p>';
});

/*
|--------------------------------------------------------------------------
| Đăng nhập / Đăng xuất
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/dang-nhap', [LoginController::class, 'hienThiForm'])->name('login');
    Route::post('/dang-nhap', [LoginController::class, 'dangNhap'])->name('login.attempt');
});

/*
|--------------------------------------------------------------------------
| Khu vực yêu cầu đăng nhập
|--------------------------------------------------------------------------
| tai.khoan.hoat.dong : đá ra ngoài nếu tài khoản bị khóa
| vai.tro             : giới hạn theo vai trò (admin / giang_vien)
*/

Route::middleware(['auth', 'tai.khoan.hoat.dong'])->group(function () {

    Route::post('/dang-xuat', [LoginController::class, 'dangXuat'])->name('logout');

    // Mọi vai trò đều tự quản lý tài khoản của bản thân.
    Route::get('/tai-khoan', [TaiKhoanController::class, 'edit'])->name('taikhoan.edit');
    Route::put('/tai-khoan', [TaiKhoanController::class, 'update'])->name('taikhoan.update');

    // Giảng viên và admin đều được quản lý lớp học, sinh viên.
    Route::middleware('vai.tro:admin,giang_vien')->group(function () {

        // lớp học
        Route::get('/lophoc', [LopHocController::class, 'index'])->name('lophoc.index');
        Route::get('/lophoc/them', [LopHocController::class, 'create'])->name('lophoc.create');
        Route::post('/lophoc', [LopHocController::class, 'store'])->name('lophoc.store');
        Route::get('/lophoc/{lop_hoc}', [LopHocController::class, 'show'])->name('lophoc.show');
        Route::get('/lophoc/{lop_hoc}/sua', [LopHocController::class, 'edit'])->name('lophoc.edit');
        Route::put('/lophoc/{lop_hoc}', [LopHocController::class, 'update'])->name('lophoc.update');
        Route::delete('/lophoc/{lop_hoc}', [LopHocController::class, 'destroy'])->name('lophoc.destroy');

        // sinh viên
        Route::get('/sinhvien', [SinhVienController::class, 'index'])->name('sinhvien.index');
        Route::get('/sinhvien/them', [SinhVienController::class, 'create'])->name('sinhvien.create');
        Route::post('/sinhvien', [SinhVienController::class, 'store'])->name('sinhvien.store');
        Route::get('/sinhvien/{id}', [SinhVienController::class, 'show'])->name('sinhvien.show');
        Route::get('/sinhvien/{id}/sua', [SinhVienController::class, 'edit'])->name('sinhvien.edit');
        Route::put('/sinhvien/{id}', [SinhVienController::class, 'update'])->name('sinhvien.update');
        Route::delete('/sinhvien/{id}', [SinhVienController::class, 'destroy'])->name('sinhvien.destroy');
    });

    // Chỉ admin: quản lý menu và quản lý người dùng.
    Route::middleware('vai.tro:admin')->group(function () {

        // menu
        Route::get('/menu', [MenuController::class, 'index'])->name('menu.index');
        Route::get('/menu/them', [MenuController::class, 'create'])->name('menu.create');
        Route::post('/menu', [MenuController::class, 'store'])->name('menu.store');
        Route::get('/menu/{id}/sua', [MenuController::class, 'edit'])->name('menu.edit');
        Route::put('/menu/{id}', [MenuController::class, 'update'])->name('menu.update');
        Route::delete('/menu/{id}', [MenuController::class, 'destroy'])->name('menu.destroy');

        // người dùng
        Route::get('/nguoi-dung', [NguoiDungController::class, 'index'])->name('nguoidung.index');
        Route::get('/nguoi-dung/them', [NguoiDungController::class, 'create'])->name('nguoidung.create');
        Route::post('/nguoi-dung', [NguoiDungController::class, 'store'])->name('nguoidung.store');
        Route::get('/nguoi-dung/{nguoi_dung}/sua', [NguoiDungController::class, 'edit'])->name('nguoidung.edit');
        Route::put('/nguoi-dung/{nguoi_dung}', [NguoiDungController::class, 'update'])->name('nguoidung.update');
        Route::delete('/nguoi-dung/{nguoi_dung}', [NguoiDungController::class, 'destroy'])->name('nguoidung.destroy');
    });
});
