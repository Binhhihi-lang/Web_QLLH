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
            DanhMucSeeder::class,
            GiangVienSeeder::class,
            SinhVienSeeder::class,
            LopHocPhanSeeder::class,
            BuoiHocSeeder::class,
            DangKyHocPhanSeeder::class,
            DiemDanhSeeder::class,
            DiemSeeder::class,
        ]);
    }
}
