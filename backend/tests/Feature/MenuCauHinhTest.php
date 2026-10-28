<?php

namespace Tests\Feature;

use App\Models\CauHinh;
use App\Models\Menu;
use App\Models\NhatKy;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuCauHinhTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_danh_sach_menu_chi_tra_menu_hien_thi_phu_hop_vai_tro_va_vi_tri(): void
    {
        Menu::factory()->create(['ten' => 'Dùng chung', 'vi_tri' => 'sidebar', 'thu_tu' => 1]);
        Menu::factory()->create([
            'ten' => 'Dành cho sinh viên',
            'vi_tri' => 'sidebar',
            'vai_tro' => User::SINH_VIEN,
            'thu_tu' => 2,
        ]);
        Menu::factory()->chiAdmin()->create(['ten' => 'Chỉ quản trị', 'vi_tri' => 'sidebar']);
        Menu::factory()->daAn()->create(['ten' => 'Đang ẩn', 'vi_tri' => 'sidebar']);
        Menu::factory()->create(['ten' => 'Header', 'vi_tri' => 'header']);

        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);

        $this->actingAs($sinhVien, 'sanctum')
            ->getJson('/api/menus?vi_tri=sidebar')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.ten', 'Dùng chung')
            ->assertJsonPath('data.1.ten', 'Dành cho sinh viên');
    }

    public function test_admin_thay_toan_bo_menu_dang_hien_thi_ke_ca_menu_cua_vai_tro_khac(): void
    {
        Menu::factory()->create(['ten' => 'Dùng chung', 'vi_tri' => 'sidebar', 'thu_tu' => 1]);
        Menu::factory()->create([
            'ten' => 'Đăng ký hộ',
            'vi_tri' => 'sidebar',
            'vai_tro' => [User::ADMIN],
            'thu_tu' => 2,
        ]);
        Menu::factory()->create([
            'ten' => 'Điểm danh',
            'vi_tri' => 'sidebar',
            'vai_tro' => [User::ADMIN, User::GIANG_VIEN],
            'thu_tu' => 3,
        ]);
        Menu::factory()->create([
            'ten' => 'Đăng ký của tôi',
            'vi_tri' => 'sidebar',
            'vai_tro' => [User::SINH_VIEN],
            'thu_tu' => 4,
        ]);
        Menu::factory()->daAn()->create(['ten' => 'Đang ẩn', 'vi_tri' => 'sidebar']);

        // ADMIN thấy đúng những mục có ghi ADMIN trong `vai_tro`; mục chỉ dành
        // cho sinh viên thì không, vì ADMIN không có hồ sơ sinh viên.
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/menus?vi_tri=sidebar')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.ten', 'Dùng chung')
            ->assertJsonPath('data.1.ten', 'Đăng ký hộ')
            ->assertJsonPath('data.2.ten', 'Điểm danh');
    }

    public function test_admin_thuc_hien_crud_menu_va_xoa_mem_co_nhat_ky(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/menus', [
                'ten' => 'Báo cáo',
                'url' => '/bao-cao',
                'vi_tri' => 'sidebar',
                'nhom' => 'Hệ thống',
                'vai_tro' => [User::ADMIN, User::GIANG_VIEN],
                'thu_tu' => 5,
            ])
            ->assertCreated()
            ->assertJsonPath('data.ten', 'Báo cáo')
            ->assertJsonPath('data.vai_tro', [User::ADMIN, User::GIANG_VIEN]);

        $menu = Menu::query()->where('url', '/bao-cao')->firstOrFail();

        $this->getJson("/api/menus/{$menu->id}")
            ->assertOk()
            ->assertJsonPath('data.vi_tri', 'sidebar');

        $this->putJson("/api/menus/{$menu->id}", [
            'ten' => 'Báo cáo học vụ',
            'url' => '/bao-cao-hoc-vu',
            'vi_tri' => 'header',
            'trang_thai' => false,
        ])->assertOk()
            ->assertJsonPath('data.ten', 'Báo cáo học vụ')
            ->assertJsonPath('data.trang_thai', false);

        $this->deleteJson("/api/menus/{$menu->id}")
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('menu', [
            'id' => $menu->id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'menu',
            'doi_tuong_id' => $menu->id,
            'hanh_dong' => NhatKy::XOA,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);
        $this->getJson("/api/menus/{$menu->id}")->assertNotFound();
    }

    public function test_menu_yeu_cau_dang_nhap_va_thao_tac_quan_tri_chi_danh_cho_admin(): void
    {
        $menu = Menu::factory()->create();

        $this->getJson('/api/menus')
            ->assertUnauthorized()
            ->assertJsonPath('ma_loi', 'UNAUTHENTICATED');

        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);
        $this->actingAs($giangVien, 'sanctum')
            ->getJson('/api/menus')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson("/api/menus/{$menu->id}")->assertForbidden();
        $this->postJson('/api/menus', [
            'ten' => 'Không được phép',
            'url' => '/cam',
            'vi_tri' => 'sidebar',
        ])->assertForbidden();
    }

    public function test_menu_tu_choi_url_khong_an_toan_va_vi_tri_khong_hop_le(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/menus', [
                'ten' => 'Liên kết nguy hiểm',
                'url' => 'javascript:alert(1)',
                'vi_tri' => 'footer',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors(['url', 'vi_tri']);
    }

    public function test_admin_doc_va_cap_nhat_cau_hinh_dang_khoa_gia_tri(): void
    {
        $this->seed(CauHinhSeeder::class);
        $phanHoi = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings')
            ->assertOk();
        $duLieu = $phanHoi->json('data');
        $this->assertSame(0.5, $duLieu['diem.trong_so']['cuoi_ky']);
        $this->assertCount(5, $duLieu['diem.bang_quy_doi']);

        $phanHoi = $this->putJson('/api/settings', [
            'diem.trong_so' => [
                'chuyen_can' => 0.2,
                'giua_ky' => 0.3,
                'cuoi_ky' => 0.5,
            ],
        ])->assertOk();
        $duLieu = $phanHoi->json('data');
        $this->assertSame(0.2, $duLieu['diem.trong_so']['chuyen_can']);
        $this->assertSame('A', $duLieu['diem.bang_quy_doi'][0]['chu']);

        $this->assertSame(
            7,
            CauHinh::query()->where('khoa', 'diem.diem_danh.sua_trong_so_ngay')->firstOrFail()->gia_tri,
        );
    }

    public function test_cau_hinh_chi_danh_cho_admin(): void
    {
        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);

        $this->actingAs($giangVien, 'sanctum')
            ->getJson('/api/settings')
            ->assertForbidden();
        $this->putJson('/api/settings', ['diem.trong_so' => []])
            ->assertForbidden();
    }

    public function test_bang_quy_doi_tu_choi_khoang_chong_lan_khong_phu_kin_va_chu_khong_hop_le(): void
    {
        $this->seed(CauHinhSeeder::class);
        $this->actingAs($this->admin, 'sanctum');

        $bangMacDinh = CauHinh::lay('diem.bang_quy_doi');
        $truongHopSai = [];

        $chongLan = $bangMacDinh;
        $chongLan[1]['tu'] = 8.0;
        $truongHopSai[] = $chongLan;

        $khongPhuKin = $bangMacDinh;
        $khongPhuKin[1]['tu'] = 7.1;
        $truongHopSai[] = $khongPhuKin;

        $saiChu = $bangMacDinh;
        $saiChu[0]['chu'] = 'Z';
        $truongHopSai[] = $saiChu;

        foreach ($truongHopSai as $bangQuyDoi) {
            $this->putJson('/api/settings', ['diem.bang_quy_doi' => $bangQuyDoi])
                ->assertUnprocessable()
                ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
                ->assertJsonValidationErrors(['diem.bang_quy_doi']);
        }
    }

    public function test_trong_so_diem_phai_co_tong_bang_mot(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings', [
                'diem.trong_so' => [
                    'chuyen_can' => 0.2,
                    'giua_ky' => 0.3,
                    'cuoi_ky' => 0.4,
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors(['diem.trong_so']);
    }
}
