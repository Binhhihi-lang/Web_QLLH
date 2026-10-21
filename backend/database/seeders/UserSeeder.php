<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Tạo tài khoản mẫu cho hai nhóm người dùng.
     * Dùng email cố định nên chạy lại nhiều lần không tạo trùng.
     */
    public function run(): void
    {
        $taiKhoan = [
            [
                'email' => 'admin@example.com',
                'name' => 'Quản trị viên',
                'vai_tro' => User::ADMIN,
            ],
            [
                'email' => 'giangvien@example.com',
                'name' => 'Giảng viên mẫu',
                'vai_tro' => User::GIANG_VIEN,
            ],
            [
                'email' => 'test@example.com',
                'name' => 'Test User',
                'vai_tro' => User::GIANG_VIEN,
            ],
        ];

        foreach ($taiKhoan as $duLieu) {
            User::updateOrCreate(
                ['email' => $duLieu['email']],
                [
                    'name' => $duLieu['name'],
                    'vai_tro' => $duLieu['vai_tro'],
                    'trang_thai' => true,
                    'password' => Hash::make('password'),
                ]
            );
        }

        // Thêm tài khoản ngẫu nhiên để thực hành phân trang / lọc.
        // Chỉ sinh khi chưa đủ, để chạy lại seeder không tạo thêm trùng lặp.
        if (User::whereNotIn('email', array_column($taiKhoan, 'email'))->count() < 10) {
            User::factory()->count(8)->giangVien()->create();
            User::factory()->count(2)->admin()->create();
        }
    }
}
