<?php

use App\Models\Menu;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Xóa menu cũ nếu có
        Menu::query()->where('url', '/chuong-trinh-khung')->delete();

        // Thêm hoặc cập nhật menu "Chương trình học" cho sinh viên
        Menu::updateOrCreate(
            ['url' => '/chuong-trinh-hoc', 'vi_tri' => 'sidebar'],
            [
                'ten' => 'Chương trình học',
                'url' => '/chuong-trinh-hoc',
                'vi_tri' => 'sidebar',
                'nhom' => 'Học vụ',
                'vai_tro' => [User::SINH_VIEN],
                'thu_tu' => 15,
                'trang_thai' => true,
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Menu::query()->where('url', '/chuong-trinh-hoc')->delete();
    }
};
