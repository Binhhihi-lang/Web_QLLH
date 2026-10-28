<?php

namespace Tests\Feature;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuQuanLyDanhSachTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_co_the_lay_toan_bo_menu_chua_xoa_ke_ca_menu_an_va_vai_tro_khac(): void
    {
        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        Menu::factory()->create(['ten' => 'Dùng chung']);
        Menu::factory()->create(['ten' => 'Dành cho sinh viên', 'vai_tro' => User::SINH_VIEN]);
        Menu::factory()->daAn()->create(['ten' => 'Đang ẩn']);
        Menu::factory()->create(['ten' => 'Đã xóa'])->delete();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/menus?quan_ly=1')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment(['ten' => 'Dùng chung'])
            ->assertJsonFragment(['ten' => 'Dành cho sinh viên'])
            ->assertJsonFragment(['ten' => 'Đang ẩn', 'trang_thai' => false])
            ->assertJsonMissing(['ten' => 'Đã xóa']);
    }

    public function test_chi_admin_duoc_dung_che_do_danh_sach_quan_ly_menu(): void
    {
        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);

        $this->actingAs($giangVien, 'sanctum')
            ->getJson('/api/menus?quan_ly=1')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }
}
