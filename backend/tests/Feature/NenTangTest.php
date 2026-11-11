<?php

namespace Tests\Feature;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LichThi;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\Menu;
use App\Models\MonHoc;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Database\Seeders\DanhMucSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\GiangVienSeeder;
use Database\Seeders\KhoaNganhSeeder;
use Database\Seeders\LopHocPhanSeeder;
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
        $this->assertCount(8, $bangQuyDoi);
        $this->assertSame('A', $bangQuyDoi[0]['chu']);
        // JSON round-trip biến 4.0 thành 4 (int) nên so sánh lỏng.
        $this->assertEquals(4.0, $bangQuyDoi[0]['he_4']);
        $this->assertSame('Giỏi', $bangQuyDoi[0]['xep_loai']);
        $this->assertSame('B+', $bangQuyDoi[1]['chu']);
        $this->assertEquals(3.5, $bangQuyDoi[1]['he_4']);
        $this->assertSame('Khá giỏi', $bangQuyDoi[1]['xep_loai']);
        $this->assertSame('F', $bangQuyDoi[7]['chu']);
        $this->assertSame('Kém (không đạt)', $bangQuyDoi[7]['xep_loai']);
        $this->assertFalse($bangQuyDoi[7]['dat']);
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

    /**
     * Kỳ 2026-2 phải có lớp để màn đăng ký học phần có dữ liệu, và đợt đăng ký
     * của kỳ đó phải đang mở (docs/03-data-model.md §7).
     */
    public function test_hoc_ky_2026_2_co_lop_va_dang_mo_dot_dang_ky(): void
    {
        $this->seed(UserSeeder::class);
        $this->seed(KhoaNganhSeeder::class);
        $this->seed(DanhMucSeeder::class);
        $this->seed(GiangVienSeeder::class);
        $this->seed(LopHocPhanSeeder::class);

        $hocKy = HocKy::query()->where('ma_hoc_ky', '2026-2')->firstOrFail();

        // 30 lớp, tất cả OPEN để nhận đăng ký.
        $this->assertSame(30, LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->count());
        $this->assertSame(0, LopHocPhan::query()
            ->where('hoc_ky_id', $hocKy->id)
            ->where('trang_thai', '!=', LopHocPhan::OPEN)
            ->count());

        // Mã lớp sinh tiếp từ LHP0121, không đụng 120 dòng cũ của 2026-1 và 2025-2.
        $maLop = LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->orderBy('id')->pluck('ma_lop_hp')->all();
        $this->assertSame('LHP0121', $maLop[0]);
        $this->assertSame('LHP0150', $maLop[29]);
        $this->assertSame(150, LopHocPhan::query()->count());

        // Đợt đăng ký đang mở tại thời điểm 2026-11-09 (ngày chốt của brief).
        $this->assertTrue($hocKy->dangMoDangKy(), 'Kỳ 2026-2 phải đang trong đợt đăng ký để demo.');
        $this->assertSame('2026-11-01 08:00:00', $hocKy->mo_dang_ky_luc->format('Y-m-d H:i:s'));
        $this->assertSame('2026-12-31 17:00:00', $hocKy->dong_dang_ky_luc->format('Y-m-d H:i:s'));

        // Vẫn thoả quy tắc BR-25 mà `HocKyController::duLieuHopLe()` áp cho thao tác
        // sửa qua API: đợt đăng ký ĐÓNG trước hoặc đúng ngày bắt đầu kỳ. Nếu không,
        // dữ liệu seed sẽ là trạng thái mà chính API từ chối ghi ra.
        $this->assertLessThanOrEqual(
            $hocKy->ngay_bat_dau->toDateString(),
            $hocKy->dong_dang_ky_luc->toDateString(),
            'Đợt đăng ký phải đóng trước hoặc đúng ngày bắt đầu học kỳ (BR-25).',
        );
    }

    /**
     * Mục đích cuối cùng của Việc 2 + 3: sinh viên đăng ký được lớp 2026-2
     * bằng dữ liệu seed, không phải chỉ "có bản ghi lớp trong DB".
     */
    public function test_sinh_vien_dang_ky_duoc_lop_cua_hoc_ky_2026_2(): void
    {
        $this->seed(DatabaseSeeder::class);

        $user = User::query()->where('email', 'sinhvien@example.com')->firstOrFail();
        $hocKy = HocKy::query()->where('ma_hoc_ky', '2026-2')->firstOrFail();

        // Lớp `nam_thu = null` để không vướng BR-23 (sai năm thứ) khi kiểm luồng đăng ký.
        $lop = LopHocPhan::query()
            ->where('hoc_ky_id', $hocKy->id)
            ->whereNull('nam_thu')
            ->where('trang_thai', LopHocPhan::OPEN)
            ->orderBy('id')
            ->firstOrFail();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lop->id])
            ->assertCreated()
            ->assertJsonPath('data.lop_hoc_phan.ma_lop_hp', $lop->ma_lop_hp)
            ->assertJsonPath('data.lop_hoc_phan.hoc_ky.id', $hocKy->id);
    }

    /**
     * Phụ thuộc chéo của khối seed: `BuoiHocSeeder` sinh 17 buổi cho MỌI lớp, kể cả
     * lớp của kỳ UPCOMING — nên thêm 30 lớp 2026-2 làm số buổi tăng từ 2.040 lên
     * 2.550. `LichThiSeeder` đã xử lý sẵn 3 kỳ (`CAC_HOC_KY`). Khoá lại để lần sau
     * ai thêm kỳ/lớp biết ngay chỗ nào phải cập nhật.
     */
    public function test_them_lop_2026_2_khong_lam_hong_buoi_hoc_va_lich_thi(): void
    {
        $this->seed(DatabaseSeeder::class);

        $soLop = LopHocPhan::query()->count();
        $this->assertSame(150, $soLop);
        $this->assertSame($soLop * 17, BuoiHoc::query()->count());

        $hocKy2026_2 = HocKy::query()->where('ma_hoc_ky', '2026-2')->firstOrFail();
        $this->assertGreaterThan(0, BuoiHoc::query()
            ->whereHas('lopHocPhan', fn ($query) => $query->where('hoc_ky_id', $hocKy2026_2->id))
            ->count());

        // 2026-2 vẫn có ca thi dù trước đây chưa có lớp nào (LichThiSeeder lấy toàn
        // bộ môn đang hoạt động khi kỳ chưa có lớp) — giờ có lớp thì lấy môn của lớp.
        $this->assertGreaterThan(0, LichThi::query()->where('hoc_ky_id', $hocKy2026_2->id)->count());
    }

    /**
     * Dashboard giảng viên vẽ biểu đồ từ `lop_phu_trach[].diem_tb_lop`. Nếu
     * `DiemSeeder` chỉ sinh điểm cho kỳ đã đóng thì kỳ đang chạy không có cột
     * nào — biểu đồ trống khi demo dù code đúng.
     */
    public function test_diem_seeder_sinh_diem_cho_ky_dang_chay_de_bieu_do_giang_vien_co_du_lieu(): void
    {
        $this->seed(DatabaseSeeder::class);

        $hocKyDangChay = HocKy::query()->where('ma_hoc_ky', '2026-1')->firstOrFail();

        $soLopCoDiem = LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyDangChay->id)
            ->whereHas('dangKyHocPhan.diem', fn ($query) => $query->whereNotNull('diem_tong_ket'))
            ->count();

        $this->assertGreaterThan(
            0,
            $soLopCoDiem,
            'Phải có ít nhất một lớp của kỳ đang chạy đã có điểm, nếu không biểu đồ "Điểm TB lớp phụ trách" trống.',
        );

        $tongSoLopDangChay = LopHocPhan::query()->where('hoc_ky_id', $hocKyDangChay->id)->count();
        $soLopDaChotDangChay = LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyDangChay->id)
            ->whereNotNull('chot_diem_luc')
            ->count();

        // Kỳ đang chạy chỉ chốt điểm một số lớp đã học xong, các lớp còn lại chưa chốt.
        $this->assertSame($soLopCoDiem, $soLopDaChotDangChay);
        $this->assertLessThan($tongSoLopDangChay, $soLopDaChotDangChay);

        // Kỳ đã đóng chốt điểm toàn bộ lớp.
        $hocKyDaDong = HocKy::query()->where('ma_hoc_ky', '2025-2')->firstOrFail();
        $this->assertSame(
            LopHocPhan::query()->where('hoc_ky_id', $hocKyDaDong->id)->count(),
            LopHocPhan::query()->where('hoc_ky_id', $hocKyDaDong->id)->whereNotNull('chot_diem_luc')->count(),
        );
    }

    public function test_seeder_menu_loc_theo_vai_tro(): void
    {
        $this->seed(MenuSeeder::class);

        $menuSinhVien = Menu::hienThiCho(User::SINH_VIEN)->pluck('url')->all();
        $menuGiangVien = Menu::hienThiCho(User::GIANG_VIEN)->pluck('url')->all();
        $menuAdmin = Menu::hienThiCho(User::ADMIN)->pluck('url')->all();

        // /dang-ky là SCR-30 đăng ký HỘ, chỉ ADMIN — sinh viên dùng /dang-ky-cua-toi.
        $this->assertNotContains('/dang-ky', $menuSinhVien);
        $this->assertContains('/dang-ky-cua-toi', $menuSinhVien);
        $this->assertNotContains('/nguoi-dung', $menuSinhVien);

        $this->assertContains('/diem-danh', $menuGiangVien);
        $this->assertNotContains('/dang-ky', $menuGiangVien);

        // ADMIN thấy mục có ghi ADMIN, kể cả mục dùng chung với vai trò khác.
        $this->assertContains('/nguoi-dung', $menuAdmin);
        $this->assertContains('/dang-ky', $menuAdmin);
        $this->assertContains('/diem-danh', $menuAdmin);
        $this->assertContains('/khoa', $menuAdmin);
        $this->assertContains('/nganh', $menuAdmin);

        // Nhưng KHÔNG thấy hai mục cá nhân của sinh viên: ADMIN không có hồ sơ
        // sinh viên nên hai trang đó vô nghĩa với ADMIN.
        $this->assertNotContains('/dang-ky-cua-toi', $menuAdmin);
        $this->assertNotContains('/diem-cua-toi', $menuAdmin);

        // Mọi mục sinh viên thấy, ADMIN cũng thấy — trừ ba mục cá nhân ở trên
        // (/dang-ky-cua-toi, /diem-cua-toi, /diem-danh-cua-toi) và mục
        // /dang-ky-hoc-phan: sinh viên tự đăng ký, ADMIN dùng /dang-ky.
        $this->assertSame(
            ['/dang-ky-hoc-phan', '/dang-ky-cua-toi', '/diem-danh-cua-toi', '/diem-cua-toi'],
            array_values(array_diff($menuSinhVien, $menuAdmin)),
        );

        // Sinh viên không thấy màn quản lý lớp học phần.
        $this->assertNotContains('/lop-hoc-phan', $menuSinhVien);
        $this->assertContains('/lop-hoc-phan', $menuGiangVien);
        $this->assertContains('/lop-hoc-phan', $menuAdmin);

        // Lịch thi hiện cho cả ba vai trò.
        $this->assertContains('/lich-thi', $menuSinhVien);
        $this->assertContains('/lich-thi', $menuGiangVien);
        $this->assertContains('/lich-thi', $menuAdmin);

        // Mục giảng viên thấy, ADMIN cũng thấy hết.
        $this->assertSame([], array_diff($menuGiangVien, $menuAdmin));
    }

    public function test_endpoint_options_tra_du_lieu_va_dung_envelope(): void
    {
        $this->seed(DanhMucSeeder::class);
        $admin = User::factory()->admin()->create();

        $phanHoi = $this->actingAs($admin, 'sanctum')->getJson('/api/options/subjects');

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

    public function test_endpoint_options_yeu_cau_dang_nhap(): void
    {
        $this->getJson('/api/options/subjects')
            ->assertStatus(401)
            ->assertJsonPath('ma_loi', 'UNAUTHENTICATED');
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

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->getJson('/api/options/sections')
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

    public function test_seeder_user_khoi_phuc_tai_khoan_demo_da_xoa_mem(): void
    {
        User::create([
            'name' => 'Quản trị viên 3 cũ',
            'email' => 'admin3@example.com',
            'password' => Hash::make('old-password'),
            'vai_tro' => User::ADMIN,
            'trang_thai' => true,
            'must_change_password' => false,
        ])->delete();

        $this->seed(UserSeeder::class);
        $this->seed(UserSeeder::class);

        $admin = User::withTrashed()->where('email', 'admin3@example.com')->firstOrFail();

        $this->assertFalse($admin->trashed());
        $this->assertSame(1, User::withTrashed()->where('email', 'admin3@example.com')->count());
        $this->assertTrue(Hash::check('password', $admin->password));
    }
}
