<?php

namespace Tests\Feature;

use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Quyền đọc cấu hình điểm và roster lớp học phần.
 *
 * Hợp đồng: docs/04-api-contract.md §13 (`GET /api/settings` mở cho 3 vai trò,
 * không phải ADMIN chỉ nhận khoá `diem.*`) và §10 (`GET /api/sections/{id}/students`
 * — STUDENT đã đăng ký ACTIVE chỉ nhận `ma_sv` + `ho_ten`).
 */
class QuyenXemLopTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private HocKy $hocKy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CauHinhSeeder::class);
        // Khoá vận hành không thuộc nhóm điểm: dùng để chứng minh bộ lọc tiền tố
        // thật sự chạy, chứ không phải "tình cờ bảng chỉ có khoá diem.*".
        CauHinh::dat('he_thong.ten_truong', 'Trường Đại học Thử Nghiệm');
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
        $this->hocKy = HocKy::factory()->dangDienRa()->create();
    }

    /** @return array{0: User, 1: GiangVien} */
    private function giangVienCoTaiKhoan(): array
    {
        $user = User::factory()->giangVien()->create(['must_change_password' => false]);
        $giangVien = GiangVien::factory()->create(['user_id' => $user->id, 'trang_thai' => true]);

        return [$user, $giangVien];
    }

    /** @return array{0: User, 1: SinhVien} */
    private function sinhVienCoTaiKhoan(): array
    {
        $user = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $sinhVien = SinhVien::factory()->create(['user_id' => $user->id, 'trang_thai' => true]);

        return [$user, $sinhVien];
    }

    private function lopCuaGiangVien(GiangVien $giangVien): LopHocPhan
    {
        return LopHocPhan::factory()->create([
            'mon_hoc_id' => MonHoc::factory()->create()->id,
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
            'si_so_toi_da' => 50,
            'trang_thai' => LopHocPhan::OPEN,
        ]);
    }

    private function dangKy(SinhVien $sinhVien, LopHocPhan $lop): DangKyHocPhan
    {
        return DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subMonth(),
        ]);
    }

    // =================================================================
    // GET /api/settings — mở cho 3 vai trò, lọc khoá `diem.*`
    // =================================================================

    public function test_giang_vien_doc_cau_hinh_diem_thanh_cong_va_chi_nhan_khoa_diem(): void
    {
        [$gvUser] = $this->giangVienCoTaiKhoan();

        $data = $this->actingAs($gvUser, 'sanctum')
            ->getJson("/api/settings?hoc_ky_id={$this->hocKy->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data');

        $this->assertArrayHasKey('diem.trong_so', $data);
        $this->assertSame(
            ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.5],
            $data['diem.trong_so'],
        );
        $this->assertArrayHasKey('diem.bang_quy_doi', $data);

        $this->assertNotEmpty($data);
        foreach (array_keys($data) as $khoa) {
            $this->assertTrue(
                str_starts_with($khoa, 'diem.'),
                "Giảng viên không được nhận khoá ngoài nhóm điểm: {$khoa}",
            );
        }
        $this->assertArrayNotHasKey('he_thong.ten_truong', $data);
    }

    public function test_admin_doc_cau_hinh_van_day_du_khoa(): void
    {
        $data = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/settings?hoc_ky_id={$this->hocKy->id}")
            ->assertOk()
            ->json('data');

        $this->assertSame(
            ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.5],
            $data['diem.trong_so'],
        );
        // ADMIN thấy cả khoá ngoài nhóm điểm — hành vi cũ giữ nguyên.
        $this->assertSame('Trường Đại học Thử Nghiệm', $data['he_thong.ten_truong']);
        // `hoc_ky_id` hợp lệ nhưng chưa lưu cấu hình riêng → khoá này là null.
        $this->assertArrayHasKey('diem.cau_hinh_hoc_ky', $data);
        $this->assertNull($data['diem.cau_hinh_hoc_ky']);
    }

    public function test_sinh_vien_doc_cau_hinh_thanh_cong_va_chi_nhan_khoa_diem(): void
    {
        [$svUser] = $this->sinhVienCoTaiKhoan();

        $data = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->json('data');

        $this->assertArrayHasKey('diem.trong_so', $data);
        foreach (array_keys($data) as $khoa) {
            $this->assertTrue(str_starts_with($khoa, 'diem.'));
        }
    }

    public function test_sinh_vien_va_giang_vien_khong_ghi_duoc_cau_hinh(): void
    {
        [$svUser] = $this->sinhVienCoTaiKhoan();
        [$gvUser] = $this->giangVienCoTaiKhoan();

        $this->actingAs($svUser, 'sanctum')
            ->putJson('/api/settings', [
                'hoc_ky_id' => $this->hocKy->id,
                'diem.trong_so' => ['chuyen_can' => 0.2, 'giua_ky' => 0.3, 'cuoi_ky' => 0.5],
            ])
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');

        $this->actingAs($gvUser, 'sanctum')
            ->putJson('/api/settings', [
                'hoc_ky_id' => $this->hocKy->id,
                'diem.trong_so' => ['chuyen_can' => 0.2, 'giua_ky' => 0.3, 'cuoi_ky' => 0.5],
            ])
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    // =================================================================
    // GET /api/sections/{id}/students — roster lớp
    // =================================================================

    public function test_sinh_vien_da_dang_ky_chi_nhan_ma_va_ten_ban_hoc(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        [, $banHoc] = $this->sinhVienCoTaiKhoan();

        $lop = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lop);
        $this->dangKy($banHoc, $lop);

        $phanHoi = $this->actingAs($svUser, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/students")
            ->assertOk()
            ->assertJsonPath('success', true);

        $rows = $phanHoi->json('data');
        $this->assertCount(2, $rows);

        foreach ($rows as $row) {
            $khoa = array_keys($row);
            sort($khoa);
            $this->assertSame(['ho_ten', 'ma_sv'], $khoa);
        }

        $maSv = array_column($rows, 'ma_sv');
        $this->assertContains($sinhVien->ma_sv, $maSv);
        $this->assertContains($banHoc->ma_sv, $maSv);
    }

    public function test_sinh_vien_chua_dang_ky_lop_bi_403(): void
    {
        [$svUser] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        $this->actingAs($svUser, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/students")
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    public function test_sinh_vien_da_huy_dang_ky_bi_403(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        DangKyHocPhan::factory()->daHuy()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
        ]);

        $this->actingAs($svUser, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/students")
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    public function test_giang_vien_phu_trach_van_nhan_day_du_cot(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [, $sinhVien] = $this->sinhVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);
        $dangKy = $this->dangKy($sinhVien, $lop);

        $rows = $this->actingAs($gvUser, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/students")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $rows);
        $row = $rows[0];
        $this->assertSame($sinhVien->ma_sv, $row['ma_sv']);
        $this->assertSame($sinhVien->ho_ten, $row['ho_ten']);
        $this->assertSame($sinhVien->email, $row['email']);
        $this->assertSame($dangKy->id, $row['dang_ky_hoc_phan_id']);
        $this->assertArrayHasKey('lop', $row);
        $this->assertArrayHasKey('id', $row);
    }

    public function test_sinh_vien_khong_xem_duoc_bang_diem_ca_lop(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lop);

        $this->actingAs($svUser, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/grades")
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');

        $this->getJson("/api/sections/{$lop->id}/attendance-summary")
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }
}
