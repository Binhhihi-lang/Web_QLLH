<?php

namespace Tests\Feature;

use App\Models\CauHinh;
use App\Models\HocKy;
use App\Models\Menu;
use App\Models\NhatKy;
use App\Models\QuyDoiDiem;
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
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => '2026-2027',
            'ngay_bat_dau' => '2026-09-01',
        ]);
        $phanHoi = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings')
            ->assertOk();
        $this->getJson('/api/settings/semesters')
            ->assertOk()
            ->assertJsonPath('data.0.id', $hocKy->id)
            ->assertJsonPath('data.0.cau_hinh_da_luu', false);
        $duLieu = $phanHoi->json('data');
        $this->assertSame(0.5, $duLieu['diem.trong_so']['cuoi_ky']);
        $this->assertCount(8, $duLieu['diem.bang_quy_doi']);

        $phanHoi = $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKy->id,
            'diem.trong_so' => [
                'chuyen_can' => 0.2,
                'giua_ky' => 0.3,
                'cuoi_ky' => 0.5,
            ],
        ])->assertOk();
        $duLieu = $phanHoi->json('data');
        $this->assertSame(0.2, $duLieu['diem.trong_so']['chuyen_can']);
        $this->assertSame('A', $duLieu['diem.bang_quy_doi'][0]['chu']);
        $this->assertSame('HALF_UP_2', $duLieu['diem.cau_hinh_hoc_ky']['quy_tac_lam_tron']);
        $this->assertSame($hocKy->id, $duLieu['diem.cau_hinh_hoc_ky']['hoc_ky_id']);
        $this->getJson('/api/settings/semesters')->assertJsonPath('data.0.cau_hinh_da_luu', true);

        $this->assertSame(
            7,
            CauHinh::query()->where('khoa', 'diem.diem_danh.sua_trong_so_ngay')->firstOrFail()->gia_tri,
        );
    }

    /**
     * Đọc cấu hình điểm mở cho cả ba vai trò (màn nhập điểm của giảng viên và
     * màn điểm của sinh viên cần trọng số + bảng quy đổi); người không phải
     * ADMIN chỉ nhận khoá `diem.*`. Ghi cấu hình vẫn chỉ ADMIN.
     */
    public function test_cau_hinh_doc_mo_cho_ba_vai_tro_ghi_chi_admin(): void
    {
        $this->seed(CauHinhSeeder::class);
        // Khoá ngoài nhóm điểm để chứng minh bộ lọc tiền tố có chạy thật.
        CauHinh::dat('he_thong.ten_truong', 'Trường thử nghiệm', 'Tên trường');

        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);
        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);

        foreach ([$giangVien, $sinhVien] as $nguoiDung) {
            $duLieu = $this->actingAs($nguoiDung, 'sanctum')
                ->getJson('/api/settings')
                ->assertOk()
                ->json('data');

            $this->assertArrayHasKey('diem.trong_so', $duLieu);
            $this->assertArrayNotHasKey('he_thong.ten_truong', $duLieu);
            $this->assertSame(
                [],
                array_values(array_filter(
                    array_keys($duLieu),
                    fn (string $khoa) => ! str_starts_with($khoa, 'diem.'),
                )),
                'Người không phải ADMIN chỉ được nhận khoá diem.*',
            );

            $this->putJson('/api/settings', ['diem.trong_so' => []])
                ->assertForbidden();
        }

        // ADMIN vẫn đọc được khoá ngoài nhóm điểm. Dùng `json()` chứ không
        // `assertJsonPath`: khoá có dấu chấm nên JsonPath sẽ hiểu thành đường
        // dẫn lồng nhau.
        $duLieuAdmin = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings')
            ->assertOk()
            ->json('data');

        $this->assertSame('Trường thử nghiệm', $duLieuAdmin['he_thong.ten_truong']);
    }

    public function test_bang_quy_doi_tu_choi_khoang_chong_lan_khong_phu_kin_va_chu_khong_hop_le(): void
    {
        $this->seed(CauHinhSeeder::class);
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => '2026-2027',
            'ngay_bat_dau' => '2026-09-01',
        ]);
        $this->actingAs($this->admin, 'sanctum');

        $bangMacDinh = CauHinh::lay('diem.bang_quy_doi');
        $truongHopSai = [];

        $chongLan = $bangMacDinh;
        $chongLan[0]['tu'] = 8.4;
        $truongHopSai[] = $chongLan;

        $khongPhuKin = $bangMacDinh;
        $khongPhuKin[1]['den'] = 8.4;
        $truongHopSai[] = $khongPhuKin;

        $saiChu = $bangMacDinh;
        $saiChu[0]['chu'] = 'Z';
        $truongHopSai[] = $saiChu;

        foreach ($truongHopSai as $bangQuyDoi) {
            $this->putJson('/api/settings', [
                'hoc_ky_id' => $hocKy->id,
                'diem.bang_quy_doi' => $bangQuyDoi,
            ])
                ->assertUnprocessable()
                ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
                ->assertJsonValidationErrors(['diem.bang_quy_doi']);
        }
    }

    public function test_bang_quy_doi_cho_phep_diem_cong_va_xep_loai(): void
    {
        $this->seed(CauHinhSeeder::class);
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => '2026-2027',
            'ngay_bat_dau' => '2026-09-01',
        ]);
        $this->actingAs($this->admin, 'sanctum');
        $bangQuyDoi = [
            ['tu' => 8.5, 'den' => 10.0, 'chu' => 'A', 'he_4' => 4.0, 'xep_loai' => 'Giỏi', 'dat' => true],
            ['tu' => 8.0, 'den' => 8.49, 'chu' => 'B+', 'he_4' => 3.5, 'xep_loai' => 'Khá giỏi', 'dat' => true],
            ['tu' => 7.0, 'den' => 7.99, 'chu' => 'B', 'he_4' => 3.0, 'xep_loai' => 'Khá', 'dat' => true],
            ['tu' => 6.5, 'den' => 6.99, 'chu' => 'C+', 'he_4' => 2.5, 'xep_loai' => 'Trung bình khá', 'dat' => true],
            ['tu' => 5.5, 'den' => 6.49, 'chu' => 'C', 'he_4' => 2.0, 'xep_loai' => 'Trung bình', 'dat' => true],
            ['tu' => 5.0, 'den' => 5.49, 'chu' => 'D+', 'he_4' => 1.5, 'xep_loai' => 'Trung bình yếu', 'dat' => true],
            ['tu' => 4.0, 'den' => 4.99, 'chu' => 'D', 'he_4' => 1.0, 'xep_loai' => 'Yếu', 'dat' => true],
            ['tu' => 0.0, 'den' => 3.99, 'chu' => 'F', 'he_4' => 0.0, 'xep_loai' => 'Kém (không đạt)', 'dat' => false],
        ];

        $duLieu = $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKy->id,
            'diem.bang_quy_doi' => $bangQuyDoi,
        ])
            ->assertOk()
            ->json('data');

        $this->assertSame('B+', $duLieu['diem.bang_quy_doi'][1]['chu']);
        $this->assertSame('Trung bình khá', $duLieu['diem.bang_quy_doi'][3]['xep_loai']);
        $this->assertSame(8, count(CauHinh::lay('diem.bang_quy_doi')));
    }

    public function test_moi_hoc_ky_co_cau_hinh_doc_lap_va_co_the_cap_nhat_lai_khi_chua_dien_ra(): void
    {
        $this->seed(CauHinhSeeder::class);
        $namHoc = '2026-2027';
        $hocKy1 = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => $namHoc,
            'ky_thu' => 1,
            'ngay_bat_dau' => '2026-09-01',
            'ngay_ket_thuc' => '2027-01-15',
        ]);
        $hocKy2 = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-2',
            'nam_hoc' => $namHoc,
            'ky_thu' => 2,
            'ngay_bat_dau' => '2027-01-20',
            'ngay_ket_thuc' => '2027-05-30',
        ]);
        $this->actingAs($this->admin, 'sanctum');

        $duLieuHocKy1 = $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKy1->id,
            'diem.trong_so' => ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.5],
            'diem.bang_quy_doi' => CauHinh::lay('diem.bang_quy_doi'),
        ])->assertOk()->json('data');
        $this->assertSame($hocKy1->id, $duLieuHocKy1['diem.cau_hinh_hoc_ky']['hoc_ky_id']);

        $duLieuHocKy2 = $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKy2->id,
            'diem.trong_so' => ['chuyen_can' => 0.5, 'giua_ky' => 0.25, 'cuoi_ky' => 0.25],
            'diem.bang_quy_doi' => CauHinh::lay('diem.bang_quy_doi'),
        ])->assertOk()->json('data');
        $this->assertSame($hocKy2->id, $duLieuHocKy2['diem.cau_hinh_hoc_ky']['hoc_ky_id']);

        $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKy1->id,
            'diem.trong_so' => ['chuyen_can' => 0.4, 'giua_ky' => 0.3, 'cuoi_ky' => 0.3],
        ])->assertOk();

        $quyDinhHocKy1 = $this->getJson("/api/settings?hoc_ky_id={$hocKy1->id}")->assertOk()->json('data');
        $quyDinhHocKy2 = $this->getJson("/api/settings?hoc_ky_id={$hocKy2->id}")->assertOk()->json('data');
        $this->assertSame(0.4, $quyDinhHocKy1['diem.trong_so']['chuyen_can']);
        $this->assertSame(0.5, $quyDinhHocKy2['diem.trong_so']['chuyen_can']);
        $this->assertDatabaseCount('quy_doi_diem', 2);
    }

    public function test_khong_the_sua_cau_hinh_hoc_ky_dang_dien_ra_hoac_da_dong(): void
    {
        $this->seed(CauHinhSeeder::class);
        $hocKy1 = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2026-09-01',
            'trang_thai' => HocKy::ONGOING,
        ]);
        $hocKy2 = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-2',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 2,
            'ngay_bat_dau' => '2027-01-20',
        ]);
        $hocKyDong = HocKy::factory()->create([
            'ma_hoc_ky' => '2027-1',
            'nam_hoc' => '2027-2028',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2027-09-01',
            'trang_thai' => HocKy::CLOSED,
        ]);
        $this->actingAs($this->admin, 'sanctum');
        $payload = [
            'diem.trong_so' => ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.5],
            'diem.bang_quy_doi' => CauHinh::lay('diem.bang_quy_doi'),
        ];
        $this->putJson('/api/settings', [...$payload, 'hoc_ky_id' => $hocKy1->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CONFIG_LOCKED');
        $this->putJson('/api/settings', [...$payload, 'hoc_ky_id' => $hocKyDong->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CONFIG_LOCKED');
        $this->putJson('/api/settings', [...$payload, 'hoc_ky_id' => $hocKy2->id])
            ->assertOk();
        $this->assertDatabaseCount('quy_doi_diem', 1);
        $this->assertSame($hocKy2->id, (int) QuyDoiDiem::query()->firstOrFail()->hoc_ky_id);
    }

    public function test_trong_so_diem_phai_co_tong_bang_mot(): void
    {
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2026-09-01',
        ]);
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings', [
                'hoc_ky_id' => $hocKy->id,
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
