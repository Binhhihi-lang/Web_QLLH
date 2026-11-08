<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Menu theo SCR trong docs/05-screens.md, đường dẫn khớp route Angular sẽ dựng.
     */
    public function run(): void
    {
        $menus = [
            // --- Sidebar: Tổng quan ---
            ['ten' => 'Dashboard', 'url' => '/dashboard', 'vi_tri' => 'sidebar', 'nhom' => 'Tổng quan', 'vai_tro' => null, 'thu_tu' => 1],

            // --- Sidebar: Học vụ ---
            // `vai_tro` là MẢNG vai trò được thấy mục; null = mọi vai trò.
            // Mục phải khớp `data.roles` của route tương ứng trong
            // `frontend/src/app/routes/` — có test khoá ở FE.
            //
            // Sinh viên KHÔNG thấy "Lớp học phần": màn đó là quản lý lớp của
            // ADMIN/GIẢNG VIÊN. Sinh viên đăng ký qua "Đăng ký học phần" và xem
            // lại qua "Lịch sử đăng ký".
            ['ten' => 'Lịch học', 'url' => '/lich-hoc', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => null, 'thu_tu' => 10],
            ['ten' => 'Lịch thi', 'url' => '/lich-thi', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => null, 'thu_tu' => 11],
            ['ten' => 'Lớp học phần', 'url' => '/lop-hoc-phan', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 12],
            // /dang-ky là SCR-30 đăng ký HỘ — chỉ ADMIN (docs/05-screens.md §3.8).
            ['ten' => 'Đăng ký', 'url' => '/dang-ky', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::ADMIN], 'thu_tu' => 13],
            ['ten' => 'Điểm danh', 'url' => '/diem-danh', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 14],
            ['ten' => 'Điểm', 'url' => '/diem', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 15],
            // Bốn mục của sinh viên: KHÔNG ghi ADMIN — ADMIN không có hồ sơ sinh viên.
            // Tên bỏ chữ "của tôi" cho gọn; màn đã nằm trong nhóm Học vụ của chính họ.
            ['ten' => 'Đăng ký học phần', 'url' => '/dang-ky-hoc-phan', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::SINH_VIEN], 'thu_tu' => 16],
            ['ten' => 'Lịch sử đăng ký', 'url' => '/dang-ky-cua-toi', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::SINH_VIEN], 'thu_tu' => 17],
            ['ten' => 'Điểm danh', 'url' => '/diem-danh-cua-toi', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::SINH_VIEN], 'thu_tu' => 18],
            ['ten' => 'Điểm', 'url' => '/diem-cua-toi', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => [User::SINH_VIEN], 'thu_tu' => 19],

            // --- Sidebar: Đào tạo ---
            ['ten' => 'Sinh viên', 'url' => '/sinh-vien', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 20],
            ['ten' => 'Giảng viên', 'url' => '/giang-vien', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => null, 'thu_tu' => 21],
            ['ten' => 'Lớp hành chính', 'url' => '/lop-hanh-chinh', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 22],
            ['ten' => 'Môn học', 'url' => '/mon-hoc', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => null, 'thu_tu' => 23],
            ['ten' => 'Học kỳ', 'url' => '/hoc-ky', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => null, 'thu_tu' => 24],
            ['ten' => 'Phòng học', 'url' => '/phong-hoc', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => [User::ADMIN, User::GIANG_VIEN], 'thu_tu' => 25],
            ['ten' => 'Khoa', 'url' => '/khoa', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => [User::ADMIN], 'thu_tu' => 26],
            ['ten' => 'Ngành', 'url' => '/nganh', 'vi_tri' => 'sidebar', 'nhom' => 'Đào tạo', 'vai_tro' => [User::ADMIN], 'thu_tu' => 27],

            // --- Sidebar: Hệ thống ---
            ['ten' => 'Người dùng', 'url' => '/nguoi-dung', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => [User::ADMIN], 'thu_tu' => 30],
            ['ten' => 'Menu', 'url' => '/menu', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => [User::ADMIN], 'thu_tu' => 31],
            ['ten' => 'Cấu hình', 'url' => '/cau-hinh', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => [User::ADMIN], 'thu_tu' => 32],
            ['ten' => 'Nhật ký', 'url' => '/nhat-ky', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => [User::ADMIN], 'thu_tu' => 33],
            ['ten' => 'Thùng rác', 'url' => '/thung-rac', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => [User::ADMIN], 'thu_tu' => 34],

            // --- Sidebar: Cá nhân ---
            ['ten' => 'Tài khoản của tôi', 'url' => '/tai-khoan', 'vi_tri' => 'sidebar', 'nhom' => 'Cá nhân', 'vai_tro' => null, 'thu_tu' => 40],

            // --- Header ---
            ['ten' => 'Giới thiệu', 'url' => '/gioi-thieu', 'vi_tri' => 'header', 'nhom' => null, 'vai_tro' => null, 'thu_tu' => 1],
        ];

        foreach ($menus as $menu) {
            Menu::updateOrCreate(
                ['url' => $menu['url'], 'vi_tri' => $menu['vi_tri']],
                $menu + ['trang_thai' => true]
            );
        }
    }
}
