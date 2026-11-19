<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CauHinhSeeder::class,
            UserSeeder::class,
            MenuSeeder::class,
            TietHocSeeder::class,
            // Phải chạy trước DanhMucSeeder/GiangVienSeeder: hai seeder đó gắn
            // khoa_id/nganh_id nên cần danh mục có sẵn.
            KhoaNganhSeeder::class,
            DanhMucSeeder::class,
            // Chạy sau DanhMucSeeder (cần ngành + môn), trước LopHocPhanSeeder
            // (mở lớp theo chương trình cần biết môn nào của khóa nào).
            ChuongTrinhDaoTaoSeeder::class,
            GiangVienSeeder::class,
            SinhVienSeeder::class,
            LopHocPhanSeeder::class,
            BuoiHocSeeder::class,
            LichThiSeeder::class,
            DangKyHocPhanSeeder::class,
            DiemDanhSeeder::class,
            DiemSeeder::class,
            // Chạy sau DiemSeeder: cần điểm kỳ đã đóng mới biết ai chưa đạt.
            HocLaiSeeder::class,
            NhatKySeeder::class,
        ]);
    }
}
