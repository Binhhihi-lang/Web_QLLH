<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Thứ tự quan trọng: user và lớp học trước, sinh viên sau (cần lop_hoc_id).
        $this->call([
            UserSeeder::class,
            LopHocSeeder::class,
            SinhVienSeeder::class,
            MenuSeeder::class,
        ]);
    }
}
