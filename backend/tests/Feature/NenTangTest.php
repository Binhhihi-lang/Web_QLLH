<?php

namespace Tests\Feature;

use App\Exceptions\LoiNghiepVu;
use App\Models\CauHinh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\Menu;
use App\Models\MonHoc;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Database\Seeders\DanhMucSeeder;
use Database\Seeders\MenuSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Nghiệm thu Tuần 1: schema mới, quan hệ model, dữ liệu mặc định và endpoint options.
 */
class NenTangTest extends TestCase
{
    use RefreshDatabase;

    public function test_bang_va_cot_dung_theo_thiet_ke_du_lieu(): void
    {
        foreach ([
            'users', 'sinh_vien', 'giang_vien', 'lop_hanh_chinh', 'mon_hoc', 'hoc_ky',
            'phong_hoc', 'lop_hoc_phan', 'buoi_hoc', 'dang_ky_hoc_phan', 'diem_danh',
            'diem', 'lich_su_diem', 'cau_hinh', 'nhat_ky', 'menu',
        ] as $bang) {
            $this->assertTrue(
                Schema::hasTable($bang),
                "Thiếu bảng {$bang}",
            );
        }

        // Bảng cũ của mô hình v0.1 đã bị loại bỏ (ADR-003).
        foreach (['lop_hocs', 'sinh_viens', 'menus'] as $bangCu) {
            $this->assertFalse(
                Schema::hasTable($bangCu),
                "Bảng cũ {$bangCu} vẫn còn",
            );
        }
    }

    public function test_users_co_du_cot_nghiep_vu(): void
    {
        $cot = Schema::getColumnListing('users');

        foreach (['vai_tro', 'trang_thai', 'must_change_password', 'deleted_at', 'deleted_by', 'restored_by'] as $ten) {
            $this->assertContains($ten, $cot, "users thiếu cột {$ten}");
        }
    }

    public function test_bang_xoa_mem_co_du_ba_cot_kiem_toan(): void
    {
        foreach (['sinh_vien', 'giang_vien', 'lop_hoc_phan', 'buoi_hoc', 'menu'] as $bang) {
            $cot = Schema::getColumnListing($bang);

            foreach (['deleted_at', 'deleted_by', 'restored_by'] as $ten) {
                $this->assertContains($ten, $cot, "{$bang} thiếu cột {$ten}");
            }
        }

        // Không dùng soft delete cho bảng đăng ký / điểm / nhật ký.
        foreach (['dang_ky_hoc_phan', 'diem_danh', 'diem', 'nhat_ky', 'cau_hinh'] as $bang) {
            $this->assertNotContains(
                'deleted_at',
                Schema::getColumnListing($bang),
                "{$bang} không được có deleted_at",
            );
        }
    }

    public function test_quan_he_giua_cac_model(): void
    {
        $lopHanhChinh = LopHanhChinh::factory()->create();
        $sinhVien = SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopHanhChinh->id]);

        $this->assertTrue($sinhVien->user->laSinhVien());
        $this->assertSame($lopHanhChinh->id, $sinhVien->lopHanhChinh->id);
        $this->assertCount(1, $lopHanhChinh->sinhVien);

        $lopHocPhan = LopHocPhan::factory()->create();

        $this->assertNotNull($lopHocPhan->monHoc);
        $this->assertNotNull($lopHocPhan->hocKy);
        $this->assertNotNull($lopHocPhan->giangVien);
        $this->assertSame(0, $lopHocPhan->siSoHienTai());
        $this->assertSame($lopHocPhan->si_so_toi_da, $lopHocPhan->conCho());
    }

    public function test_unique_ma_lop_hp_khong_loc_ban_ghi_da_xoa(): void
    {
        $lop = LopHocPhan::factory()->create(['ma_lop_hp' => 'LHP-TRUNG']);

        $this->expectException(QueryException::class);

        LopHocPhan::factory()->create([
            'ma_lop_hp' => 'LHP-TRUNG',
            'hoc_ky_id' => $lop->hoc_ky_id,
        ]);
    }

    public function test_seeder_cau_hinh_tao_bang_quy_doi_diem(): void
    {
        $this->seed(CauHinhSeeder::class);

        $trongSo = CauHinh::lay('diem.trong_so');
        $this->assertSame(0.25, $trongSo['chuyen_can']);
        $this->assertSame(0.50, $trongSo['cuoi_ky']);

        $bangQuyDoi = CauHinh::lay('diem.bang_quy_doi');
        $this->assertCount(5, $bangQuyDoi);
        $this->assertSame('A', $bangQuyDoi[0]['chu']);
        // JSON round-trip biến 4.0 thành 4 (int) nên so sánh lỏng.
        $this->assertEquals(4.0, $bangQuyDoi[0]['he_4']);
        $this->assertSame('F', $bangQuyDoi[4]['chu']);
        $this->assertFalse($bangQuyDoi[4]['dat']);
    }

    public function test_seeder_danh_muc_tao_du_so_luong(): void
    {
        $this->seed(DanhMucSeeder::class);

        $this->assertSame(20, LopHanhChinh::count());
        $this->assertSame(30, MonHoc::count());
        $this->assertSame(3, HocKy::count());
        $this->assertSame(25, PhongHoc::count());

        $this->assertTrue(HocKy::where('ma_hoc_ky', '2025-2')->first()->trang_thai === HocKy::CLOSED);
        $this->assertTrue(HocKy::where('ma_hoc_ky', '2026-1')->first()->trang_thai === HocKy::ONGOING);
        $this->assertTrue(HocKy::where('ma_hoc_ky', '2026-2')->first()->trang_thai === HocKy::UPCOMING);
    }

    public function test_seeder_menu_loc_theo_vai_tro(): void
    {
        $this->seed(MenuSeeder::class);

        $menuSinhVien = Menu::hienThiCho(User::SINH_VIEN)->pluck('url')->all();
        $menuAdmin = Menu::hienThiCho(User::ADMIN)->pluck('url')->all();

        $this->assertContains('/dang-ky', $menuSinhVien);
        $this->assertNotContains('/nguoi-dung', $menuSinhVien);
        $this->assertContains('/nguoi-dung', $menuAdmin);
        $this->assertNotContains('/dang-ky', $menuAdmin);
    }

    public function test_endpoint_options_tra_du_lieu_va_dung_envelope(): void
    {
        $this->seed(DanhMucSeeder::class);

        $phanHoi = $this->getJson('/api/options/subjects');

        $phanHoi->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Thành công')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'label', 'so_tin_chi']],
            ]);

        $this->assertCount(30, $phanHoi->json('data'));
    }

    public function test_endpoint_options_sections_co_con_cho(): void
    {
        $this->seed(DanhMucSeeder::class);

        $mon = MonHoc::first();
        $ky = HocKy::where('ma_hoc_ky', '2026-1')->first();
        $gv = GiangVien::factory()->create();

        LopHocPhan::factory()->create([
            'ma_lop_hp' => 'LHP-CONCHO',
            'mon_hoc_id' => $mon->id,
            'hoc_ky_id' => $ky->id,
            'giang_vien_id' => $gv->id,
            'si_so_toi_da' => 40,
        ]);

        $this->getJson('/api/options/sections')
            ->assertOk()
            ->assertJsonPath('data.0.con_cho', 40);
    }

    public function test_route_khong_ton_tai_tra_envelope_404(): void
    {
        $this->getJson('/api/khong-ton-tai')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('ma_loi', 'NOT_FOUND');
    }

    public function test_chua_dang_nhap_tra_envelope_401(): void
    {
        $this->getJson('/api/user')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('ma_loi', 'UNAUTHENTICATED');
    }

    public function test_api_luon_tra_json_ke_ca_khi_thieu_accept_header(): void
    {
        // Trình duyệt/Postman có thể không gửi Accept; API không được redirect.
        $phanHoi = $this->get('/api/user');

        $phanHoi->assertUnauthorized()
            ->assertJsonPath('ma_loi', 'UNAUTHENTICATED');
    }

    public function test_loi_nghiep_vu_tra_ma_loi_tuong_ung(): void
    {
        Route::get('/api/__thu-nghiep-vu', function () {
            throw new LoiNghiepVu('SECTION_FULL', 'Lớp học phần đã đầy.');
        });

        $this->getJson('/api/__thu-nghiep-vu')
            ->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('ma_loi', 'SECTION_FULL')
            ->assertJsonPath('message', 'Lớp học phần đã đầy.');
    }

    public function test_seeder_user_tao_ba_tai_khoan_demo(): void
    {
        $this->seed(UserSeeder::class);

        $admin = User::where('email', 'admin@example.com')->first();
        $giangVien = User::where('email', 'giangvien@example.com')->first();
        $sinhVien = User::where('email', 'sinhvien@example.com')->first();

        $this->assertTrue($admin->laAdmin());
        $this->assertTrue($giangVien->laGiangVien());
        $this->assertTrue($sinhVien->laSinhVien());
        $this->assertFalse($admin->must_change_password);
        $this->assertTrue(Hash::check('password', $admin->password));
    }
}
