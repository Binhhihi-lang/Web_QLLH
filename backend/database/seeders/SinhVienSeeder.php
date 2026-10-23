<?php

namespace Database\Seeders;

use App\Models\LopHanhChinh;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SinhVienSeeder extends Seeder
{
    private const SO_LUONG = 500;

    public function run(): void
    {
        if (SinhVien::query()->exists()) {
            return;
        }

        $ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
        $dem = ['Văn', 'Thị', 'Minh', 'Quang', 'Hữu', 'Thanh', 'Ngọc', 'Đức', 'Thu', 'Anh', 'Gia', 'Khánh'];
        $ten = ['An', 'Bảo', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hân', 'Huy', 'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Tú', 'Vy', 'Yến'];

        $lopIds = LopHanhChinh::query()->orderBy('id')->pluck('id')->all();

        $matKhauChung = Hash::make('password');
        $bayGio = now();

        $users = [];
        $sinhViens = [];

        for ($i = 1; $i <= self::SO_LUONG; $i++) {
            $hoTen = $ho[($i - 1) % 12].' '.$dem[intdiv($i - 1, 12) % 12].' '.$ten[($i * 7) % 22];
            $maSv = sprintf('SV%06d', $i);
            $email = sprintf('sv%04d@example.com', $i);

            $users[] = [
                'name' => $hoTen,
                'email' => $email,
                'vai_tro' => User::SINH_VIEN,
                'trang_thai' => true,
                'must_change_password' => false,
                'password' => $matKhauChung,
                'remember_token' => Str::random(10),
                'email_verified_at' => $bayGio,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];

            $sinhViens[] = [
                'ma_sv' => $maSv,
                'ho_ten' => $hoTen,
                'ngay_sinh' => sprintf('200%d-%02d-%02d', 3 + ($i % 5), 1 + ($i % 12), 1 + ($i % 28)),
                'gioi_tinh' => $i % 2 === 0,
                'email' => $email,
                'so_dien_thoai' => '09'.str_pad((string) (20000000 + $i), 8, '0', STR_PAD_LEFT),
                'dia_chi' => 'TP. Hồ Chí Minh',
                'lop_hanh_chinh_id' => $lopIds[($i - 1) % count($lopIds)],
                'trang_thai' => true,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        // Tài khoản sinh viên demo đã có trong UserSeeder — chỉ gắn hồ sơ.
        $demoUser = User::query()->where('email', 'sinhvien@example.com')->firstOrFail();

        User::query()->insert($users);

        $idTheoEmail = User::query()
            ->whereIn('email', array_column($sinhViens, 'email'))
            ->pluck('id', 'email');

        foreach ($sinhViens as &$sv) {
            $sv['user_id'] = $idTheoEmail[$sv['email']];
        }
        unset($sv);

        $sinhViens[] = [
            'ma_sv' => 'SV000000',
            'ho_ten' => 'Trần Thị Sinh',
            'ngay_sinh' => '2005-05-05',
            'gioi_tinh' => false,
            'email' => 'sinhvien@example.com',
            'so_dien_thoai' => '0911111111',
            'dia_chi' => 'TP. Hồ Chí Minh',
            'lop_hanh_chinh_id' => $lopIds[0],
            'user_id' => $demoUser->id,
            'trang_thai' => true,
            'created_at' => $bayGio,
            'updated_at' => $bayGio,
        ];

        SinhVien::query()->insert($sinhViens);
    }
}
