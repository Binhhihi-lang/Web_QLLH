<?php

namespace Database\Seeders;

use App\Models\GiangVien;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GiangVienSeeder extends Seeder
{
    private const SO_LUONG = 50;

    public function run(): void
    {
        if (GiangVien::query()->exists()) {
            return;
        }

        $ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
        $dem = ['Văn', 'Thị', 'Minh', 'Quang', 'Hữu', 'Thanh', 'Ngọc', 'Đức', 'Thu', 'Anh'];
        $ten = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Hải', 'Hùng', 'Lan', 'Linh', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Tú', 'Vinh', 'Yến'];
        $chuyenMon = ['Công nghệ phần mềm', 'Hệ thống thông tin', 'Khoa học máy tính', 'Mạng và truyền thông', 'An toàn thông tin'];

        $matKhauChung = Hash::make('password');
        $bayGio = now();

        $users = [];
        $giangViens = [];

        for ($i = 1; $i <= self::SO_LUONG; $i++) {
            $hoTen = $ho[($i - 1) % 10].' '.$dem[intdiv($i - 1, 10) % 10].' '.$ten[($i * 3) % 18];
            $maGv = sprintf('GV%04d', $i);
            $email = sprintf('gv%03d@example.com', $i);

            $users[] = [
                'name' => $hoTen,
                'email' => $email,
                'vai_tro' => User::GIANG_VIEN,
                'trang_thai' => true,
                'must_change_password' => false,
                'password' => $matKhauChung,
                'remember_token' => Str::random(10),
                'email_verified_at' => $bayGio,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];

            $giangViens[] = [
                'ma_gv' => $maGv,
                'ho_ten' => $hoTen,
                'email' => $email,
                'so_dien_thoai' => '09'.str_pad((string) (10000000 + $i), 8, '0', STR_PAD_LEFT),
                'chuyen_mon' => $chuyenMon[$i % count($chuyenMon)],
                'trang_thai' => true,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        // Tài khoản giảng viên demo đã có trong UserSeeder — chỉ gắn hồ sơ.
        $demoUser = User::query()->where('email', 'giangvien@example.com')->firstOrFail();

        User::query()->insert($users);

        // Gắn user_id: map theo email để chắc chắn khớp.
        $idTheoEmail = User::query()
            ->whereIn('email', array_column($giangViens, 'email'))
            ->pluck('id', 'email');

        foreach ($giangViens as &$gv) {
            $gv['user_id'] = $idTheoEmail[$gv['email']];
        }
        unset($gv);

        $giangViens[] = [
            'ma_gv' => 'GV0000',
            'ho_ten' => 'Nguyễn Văn Giảng',
            'email' => 'giangvien@example.com',
            'so_dien_thoai' => '0900000000',
            'chuyen_mon' => 'Công nghệ phần mềm',
            'user_id' => $demoUser->id,
            'trang_thai' => true,
            'created_at' => $bayGio,
            'updated_at' => $bayGio,
        ];

        GiangVien::query()->insert($giangViens);
    }
}
