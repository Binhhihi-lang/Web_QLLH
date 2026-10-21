<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Tạo menu thật khớp với các route đang có.
     * Dùng url cố định nên chạy lại nhiều lần không tạo trùng.
     */
    public function run(): void
    {
        $menus = [
            // --- Sidebar: ai cũng thấy ---
            ['ten' => 'Lớp học', 'url' => '/lophoc', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => null, 'thu_tu' => 1],
            ['ten' => 'Sinh viên', 'url' => '/sinhvien', 'vi_tri' => 'sidebar', 'nhom' => 'Học vụ', 'vai_tro' => null, 'thu_tu' => 2],

            // --- Sidebar: chỉ admin ---
            ['ten' => 'Menu', 'url' => '/menu', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => User::ADMIN, 'thu_tu' => 3],
            ['ten' => 'Người dùng', 'url' => '/nguoi-dung', 'vi_tri' => 'sidebar', 'nhom' => 'Hệ thống', 'vai_tro' => User::ADMIN, 'thu_tu' => 4],

            // --- Sidebar: mục cá nhân, ai cũng thấy ---
            ['ten' => 'Tài khoản của tôi', 'url' => '/tai-khoan', 'vi_tri' => 'sidebar', 'nhom' => 'Cá nhân', 'vai_tro' => null, 'thu_tu' => 5],

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
