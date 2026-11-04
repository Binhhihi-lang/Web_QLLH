<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Ba tài khoản demo theo docs/03-data-model.md mục 7.
     * Tài khoản giảng viên/sinh viên demo được gắn hồ sơ ở GiangVienSeeder / SinhVienSeeder.
     */
    public function run(): void
    {
        $this->updateOrRestore(
            'admin@example.com',
            [
                'name' => 'Quản trị viên',
                'password' => Hash::make('password'),
                'vai_tro' => User::ADMIN,
                'trang_thai' => true,
                'must_change_password' => false,
                'email_verified_at' => now(),
            ],
        );

        $this->updateOrRestore(
            'giangvien@example.com',
            [
                'name' => 'Nguyễn Văn Giảng',
                'password' => Hash::make('password'),
                'vai_tro' => User::GIANG_VIEN,
                'trang_thai' => true,
                'must_change_password' => false,
                'email_verified_at' => now(),
            ],
        );

        $this->updateOrRestore(
            'sinhvien@example.com',
            [
                'name' => 'Trần Thị Sinh',
                'password' => Hash::make('password'),
                'vai_tro' => User::SINH_VIEN,
                'trang_thai' => true,
                'must_change_password' => false,
                'email_verified_at' => now(),
            ],
        );

        // Hai quản trị viên phụ để thử phân quyền và nhật ký.
        for ($i = 2; $i <= 3; $i++) {
            $this->updateOrRestore(
                "admin{$i}@example.com",
                [
                    'name' => "Quản trị viên {$i}",
                    'password' => Hash::make('password'),
                    'vai_tro' => User::ADMIN,
                    'trang_thai' => true,
                    'must_change_password' => false,
                    'email_verified_at' => now(),
                ],
            );
        }
    }

    private function updateOrRestore(string $email, array $attributes): User
    {
        $user = User::withTrashed()->updateOrCreate(['email' => $email], $attributes);

        if ($user->trashed()) {
            $user->restore();
        }

        return $user;
    }
}
