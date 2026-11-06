<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CauHinhController;
use App\Http\Controllers\Api\DangKyHocPhanController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiemController;
use App\Http\Controllers\Api\GiangVienController;
use App\Http\Controllers\Api\HocKyController;
use App\Http\Controllers\Api\HoSoController;
use App\Http\Controllers\Api\KhoaController;
use App\Http\Controllers\Api\LichHocController;
use App\Http\Controllers\Api\LopHanhChinhController;
use App\Http\Controllers\Api\LopHocPhanController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\MonHocController;
use App\Http\Controllers\Api\NganhController;
use App\Http\Controllers\Api\NguoiDungController;
use App\Http\Controllers\Api\OptionController;
use App\Http\Controllers\Api\PhongHocController;
use App\Http\Controllers\Api\SinhVienController;
use App\Http\Controllers\Api\ThungRacController;
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
    // FR-01.06 — sửa hồ sơ cá nhân; FR-01.10 / FR-01.11 — ảnh đại diện, dùng chung cho cả 3 vai trò
    Route::put('/me', [HoSoController::class, 'capNhatHoSo'])->name('api/me/cap-nhat');
    Route::post('/me/avatar', [HoSoController::class, 'taiAnhDaiDien'])->name('api/me/avatar');
    Route::delete('/me/avatar', [HoSoController::class, 'xoaAnhDaiDien'])->name('api/me/avatar/xoa');
    Route::get('/me/grades', [DiemController::class, 'diemCuaToi'])
        ->middleware('vai.tro:SINH_VIEN')->name('api/me/grades');
    Route::get('/me/gpa', [DiemController::class, 'gpaCuaToi'])
        ->middleware('vai.tro:SINH_VIEN')->name('api/me/gpa');

    Route::get('/schedules', [LichHocController::class, 'index'])
        ->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN')->name('api/schedules');

    Route::prefix('options')->group(function () {
        Route::get('subjects', [OptionController::class, 'subjects']);
        Route::get('semesters', [OptionController::class, 'semesters']);
        Route::get('teachers', [OptionController::class, 'teachers']);
        Route::get('rooms', [OptionController::class, 'rooms']);
        Route::get('admin-classes', [OptionController::class, 'adminClasses']);
        Route::get('sections', [OptionController::class, 'sections']);
        Route::get('khoa', [OptionController::class, 'khoa']);
        Route::get('nganh', [OptionController::class, 'nganh']);
    });

    Route::get('/semesters', [HocKyController::class, 'index'])
        ->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
    Route::post('/semesters', [HocKyController::class, 'store'])->middleware('vai.tro:ADMIN');
    Route::get('/semesters/{hocKy}', [HocKyController::class, 'show'])
        ->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
    Route::put('/semesters/{hocKy}', [HocKyController::class, 'update'])->middleware('vai.tro:ADMIN');
    Route::delete('/semesters/{hocKy}', [HocKyController::class, 'destroy'])->middleware('vai.tro:ADMIN');
    Route::patch('/semesters/{hocKy}/status', [HocKyController::class, 'capNhatTrangThai'])
        ->middleware('vai.tro:ADMIN');

    Route::get('/menus', [MenuController::class, 'index'])->name('api/menus');
    Route::middleware('vai.tro:ADMIN')->group(function () {
        Route::post('/menus', [MenuController::class, 'store'])->name('api/menus/tao');
        Route::get('/menus/{menu}', [MenuController::class, 'show'])->name('api/menus/chi-tiet');
        Route::put('/menus/{menu}', [MenuController::class, 'update'])->name('api/menus/cap-nhat');
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->name('api/menus/xoa');
        Route::get('/settings', [CauHinhController::class, 'index'])->name('api/settings');
        Route::put('/settings', [CauHinhController::class, 'update'])->name('api/settings/cap-nhat');
        Route::get('/settings/semesters', [CauHinhController::class, 'semesters'])
            ->name('api/settings/semesters');
        Route::get('/dashboard/admin', [DashboardController::class, 'admin'])->name('api/dashboard/admin');
        Route::get('/trash/{type}', [ThungRacController::class, 'index'])->name('api/trash/danh-sach');
        Route::post('/trash/{type}/{id}/restore', [ThungRacController::class, 'restore'])->name('api/trash/khoi-phuc');
    });

    Route::prefix('semesters')->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN')->group(function () {
        Route::get('/', [HocKyController::class, 'index']);
        Route::get('{hocKy}', [HocKyController::class, 'show']);
        Route::middleware('vai.tro:ADMIN')->group(function () {
            Route::post('/', [HocKyController::class, 'store']);
            Route::put('{hocKy}', [HocKyController::class, 'update']);
            Route::delete('{hocKy}', [HocKyController::class, 'destroy']);
            Route::patch('{hocKy}/status', [HocKyController::class, 'capNhatTrangThai']);
        });
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

    /* Đăng ký học phần — FR-09. */
    Route::prefix('enrollments')->group(function () {
        Route::get('/', [DangKyHocPhanController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::post('/', [DangKyHocPhanController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::post('/bulk', [DangKyHocPhanController::class, 'bulk'])->middleware('vai.tro:ADMIN');
        Route::delete('/{dangKy}', [DangKyHocPhanController::class, 'destroy'])->middleware('vai.tro:ADMIN');
        Route::put('/{dangKyHocPhan}/grade', [DiemController::class, 'nhapDiemDon'])->middleware('vai.tro:GIANG_VIEN,ADMIN');
        Route::get('/{dangKyHocPhan}/grade-history', [DiemController::class, 'lichSuDiem'])->middleware('vai.tro:GIANG_VIEN,ADMIN');
    });

    Route::prefix('me/enrollments')->middleware('vai.tro:SINH_VIEN')->group(function () {
        Route::get('/', [DangKyHocPhanController::class, 'cuaToi']);
        Route::post('/', [DangKyHocPhanController::class, 'cuaToiStore']);
        Route::delete('/{dangKy}', [DangKyHocPhanController::class, 'cuaToiDestroy']);
    });

    /*
    | Danh mục Khoa / Ngành — ADR-020. Đọc mở cho cả ba vai trò (dữ liệu tham chiếu),
    | ghi chỉ ADMIN. Dropdown ở FE dùng `/options/khoa` và `/options/nganh` cho nhẹ.
    */
    Route::prefix('khoa')->group(function () {
        Route::get('/', [KhoaController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [KhoaController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::get('{khoa}', [KhoaController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::put('{khoa}', [KhoaController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{khoa}', [KhoaController::class, 'destroy'])->middleware('vai.tro:ADMIN');
    });

    Route::prefix('nganh')->group(function () {
        Route::get('/', [NganhController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [NganhController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::get('{nganh}', [NganhController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::put('{nganh}', [NganhController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{nganh}', [NganhController::class, 'destroy'])->middleware('vai.tro:ADMIN');
    });

    /*
    | Lớp học phần — SCR-25 → SCR-29, SCR-40/SCR-41 (docs/04 §10).
    | `finalize` chỉ mở cho GIANG_VIEN: ADMIN chốt hộ bị 403 theo ma trận phân quyền.
    */
    Route::prefix('sections')->group(function () {
        Route::get('/', [LopHocPhanController::class, 'index'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::post('/', [LopHocPhanController::class, 'store'])->middleware('vai.tro:ADMIN');
        Route::post('{lopHocPhan}/finalize', [LopHocPhanController::class, 'chotDiem'])->middleware('vai.tro:GIANG_VIEN');
        Route::post('{lopHocPhan}/unlock', [LopHocPhanController::class, 'moKhoaDiem'])->middleware('vai.tro:ADMIN');
        Route::get('{lopHocPhan}/students', [LopHocPhanController::class, 'danhSachSinhVien'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::get('{lopHocPhan}/grades', [LopHocPhanController::class, 'bangDiem'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::put('{lopHocPhan}/grades', [LopHocPhanController::class, 'capNhatDiemHangLoat'])->middleware('vai.tro:GIANG_VIEN');
        Route::get('{lopHocPhan}/attendance-summary', [LopHocPhanController::class, 'thongKeChuyenCan'])->middleware('vai.tro:ADMIN,GIANG_VIEN');
        Route::patch('{lopHocPhan}/status', [LopHocPhanController::class, 'capNhatTrangThai'])->middleware('vai.tro:ADMIN');
        Route::get('{lopHocPhan}', [LopHocPhanController::class, 'show'])->middleware('vai.tro:ADMIN,GIANG_VIEN,SINH_VIEN');
        Route::put('{lopHocPhan}', [LopHocPhanController::class, 'update'])->middleware('vai.tro:ADMIN');
        Route::delete('{lopHocPhan}', [LopHocPhanController::class, 'destroy'])->middleware('vai.tro:ADMIN');
    });

    /*
    | Người dùng — SCR-50/SCR-51 (docs/04 §3). Toàn bộ chỉ ADMIN.
    | `bulk-status` khai trước `{nguoiDung}` cho dễ đọc dù không xung đột đường dẫn.
    */
    Route::prefix('users')->middleware('vai.tro:ADMIN')->group(function () {
        Route::get('/', [NguoiDungController::class, 'index']);
        Route::post('/', [NguoiDungController::class, 'store']);
        Route::patch('bulk-status', [NguoiDungController::class, 'capNhatTrangThaiHangLoat']);
        Route::get('{nguoiDung}', [NguoiDungController::class, 'show']);
        Route::put('{nguoiDung}', [NguoiDungController::class, 'update']);
        Route::delete('{nguoiDung}', [NguoiDungController::class, 'destroy']);
        Route::patch('{nguoiDung}/status', [NguoiDungController::class, 'capNhatTrangThai']);
        Route::post('{nguoiDung}/reset-password', [NguoiDungController::class, 'datLaiMatKhau']);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
