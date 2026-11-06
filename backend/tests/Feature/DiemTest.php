<?php

namespace Tests\Feature;

use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LichSuDiem;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiemTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private HocKy $hocKy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CauHinhSeeder::class);
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
        $this->hocKy = HocKy::factory()->dangDienRa()->create();
    }

    private function giangVienCoTaiKhoan(): array
    {
        $user = User::factory()->giangVien()->create(['must_change_password' => false]);
        $giangVien = GiangVien::factory()->create([
            'user_id' => $user->id,
            'trang_thai' => true,
        ]);

        return [$user, $giangVien];
    }

    private function sinhVienCoTaiKhoan(): array
    {
        $user = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $sinhVien = SinhVien::factory()->create([
            'user_id' => $user->id,
            'trang_thai' => true,
        ]);

        return [$user, $sinhVien];
    }

    public function test_giang_vien_nhap_diem_don_thanh_cong(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $monHoc = MonHoc::factory()->create(['so_tin_chi' => 3]);
        $lop = LopHocPhan::factory()->create([
            'mon_hoc_id' => $monHoc->id,
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
            'trang_thai' => LopHocPhan::OPEN,
            'chot_diem_luc' => null,
        ]);

        $dangKy = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.5,
                'diem_giua_ky' => 7.0,
                'diem_cuoi_ky' => 8.0,
                'ly_do' => 'Chấm điểm kết thúc học phần',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.dang_ky_hoc_phan_id', $dangKy->id)
            ->assertJsonPath('data.diem_chuyen_can', 8.5)
            ->assertJsonPath('data.diem_giua_ky', 7)
            ->assertJsonPath('data.diem_cuoi_ky', 8)
            ->assertJsonPath('data.diem_tong_ket', 7.88)
            ->assertJsonPath('data.diem_chu', 'B')
            ->assertJsonPath('data.diem_he_4', 3)
            ->assertJsonPath('data.ket_qua', Diem::DAT)
            ->assertJsonPath('data.da_chot_diem', false);

        // Kiểm tra database Diem và LichSuDiem
        $this->assertDatabaseHas('diem', [
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_chuyen_can' => 8.5,
            'diem_giua_ky' => 7.0,
            'diem_cuoi_ky' => 8.0,
            'diem_tong_ket' => 7.88,
            'ket_qua' => Diem::DAT,
        ]);

        $this->assertDatabaseHas('lich_su_diem', [
            'truong' => 'diem_tong_ket',
            'gia_tri_moi' => '7.88',
            'nguoi_sua_id' => $gvUser->id,
            'ly_do' => 'Chấm điểm kết thúc học phần',
        ]);
    }

    public function test_giang_vien_khong_phu_trach_lop_bi_403(): void
    {
        [$gv1User, $gv1] = $this->giangVienCoTaiKhoan();
        [$gv2User, $gv2] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $gv1->id,
            'trang_thai' => LopHocPhan::OPEN,
        ]);

        $dangKy = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($gv2User, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.0,
                'diem_giua_ky' => 8.0,
                'diem_cuoi_ky' => 8.0,
            ])
            ->assertStatus(403);
    }

    public function test_lop_da_chot_diem_bi_chan_409(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
            'chot_diem_luc' => now(),
        ]);

        $dangKy = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($gvUser, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.0,
                'diem_giua_ky' => 8.0,
                'diem_cuoi_ky' => 8.0,
            ])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'GRADE_LOCKED');
    }

    public function test_hoc_ky_da_dong_bi_chan_409(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $kyDong = HocKy::factory()->daDong()->create();

        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $kyDong->id,
            'giang_vien_id' => $giangVien->id,
            'chot_diem_luc' => null,
        ]);

        $dangKy = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($gvUser, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.0,
                'diem_giua_ky' => 8.0,
                'diem_cuoi_ky' => 8.0,
            ])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');
    }

    public function test_xem_lich_su_sua_diem(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);

        $dangKy = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        // Giảng viên nhập lần 1
        $this->actingAs($gvUser, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.0,
                'diem_giua_ky' => 6.0,
                'diem_cuoi_ky' => 7.0,
                'ly_do' => 'Nhập điểm ban đầu',
            ])
            ->assertOk();

        // Giảng viên sửa lần 2
        $this->actingAs($gvUser, 'sanctum')
            ->putJson("/api/enrollments/{$dangKy->id}/grade", [
                'diem_chuyen_can' => 8.0,
                'diem_giua_ky' => 7.5,
                'diem_cuoi_ky' => 7.0,
                'ly_do' => 'Phúc khảo giữa kỳ',
            ])
            ->assertOk();

        // Xem lịch sử
        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson("/api/enrollments/{$dangKy->id}/grade-history")
            ->assertOk()
            ->assertJsonPath('success', true);

        $lichSu = $response->json('data');
        $this->assertNotEmpty($lichSu);
        $truongs = array_column($lichSu, 'truong');
        $this->assertContains('diem_giua_ky', $truongs);
        $this->assertContains('diem_tong_ket', $truongs);
    }

    public function test_sinh_vien_xem_bang_diem_ca_nhan(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        $mon1 = MonHoc::factory()->create(['ma_mon' => 'INT3306', 'ten_mon' => 'Lập trình web', 'so_tin_chi' => 3]);
        $mon2 = MonHoc::factory()->create(['ma_mon' => 'INT3307', 'ten_mon' => 'Cơ sở dữ liệu', 'so_tin_chi' => 3]);

        $lop1 = LopHocPhan::factory()->create(['mon_hoc_id' => $mon1->id, 'hoc_ky_id' => $this->hocKy->id, 'giang_vien_id' => $giangVien->id]);
        $lop2 = LopHocPhan::factory()->create(['mon_hoc_id' => $mon2->id, 'hoc_ky_id' => $this->hocKy->id, 'giang_vien_id' => $giangVien->id]);

        $dangKy1 = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop1->id, 'sinh_vien_id' => $sinhVien->id, 'trang_thai' => DangKyHocPhan::ACTIVE]);
        $dangKy2 = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop2->id, 'sinh_vien_id' => $sinhVien->id, 'trang_thai' => DangKyHocPhan::ACTIVE]);

        // Nhập điểm môn 1 (8.5, 7.0, 8.0) => 7.88 (B, 3.0)
        $this->actingAs($gvUser, 'sanctum')->putJson("/api/enrollments/{$dangKy1->id}/grade", [
            'diem_chuyen_can' => 8.5, 'diem_giua_ky' => 7.0, 'diem_cuoi_ky' => 8.0,
        ])->assertOk();

        // Nhập điểm môn 2 (9.0, 9.0, 9.0) => 9.00 (A, 4.0)
        $this->actingAs($gvUser, 'sanctum')->putJson("/api/enrollments/{$dangKy2->id}/grade", [
            'diem_chuyen_can' => 9.0, 'diem_giua_ky' => 9.0, 'diem_cuoi_ky' => 9.0,
        ])->assertOk();

        // Sinh viên xem điểm của tôi
        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson("/api/me/grades?hoc_ky_id={$this->hocKy->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.hoc_ky.id', $this->hocKy->id)
            ->assertJsonPath('data.tong_tin_chi', 6)
            ->assertJsonPath('data.gpa_he_10', 8.44)
            ->assertJsonPath('data.gpa_he_4', 3.5);

        $this->assertCount(2, $response->json('data.mon_hoc'));
    }

    public function test_sinh_vien_xem_gpa_cpa_tich_luy(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();

        // Kỳ CLOSED 1
        $kyClosed = HocKy::factory()->daDong()->create();
        $mon1 = MonHoc::factory()->create(['so_tin_chi' => 3]);
        $lop1 = LopHocPhan::factory()->create(['mon_hoc_id' => $mon1->id, 'hoc_ky_id' => $kyClosed->id, 'giang_vien_id' => $giangVien->id]);
        $dk1 = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop1->id, 'sinh_vien_id' => $sinhVien->id, 'trang_thai' => DangKyHocPhan::ACTIVE]);

        // Tạo điểm trực tiếp cho kỳ closed
        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dk1->id,
            'diem_tong_ket' => 8.0,
            'diem_he_4' => 3.5,
            'ket_qua' => Diem::DAT,
        ]);

        // Kỳ ONGOING hiện tại
        $mon2 = MonHoc::factory()->create(['so_tin_chi' => 3]);
        $lop2 = LopHocPhan::factory()->create(['mon_hoc_id' => $mon2->id, 'hoc_ky_id' => $this->hocKy->id, 'giang_vien_id' => $giangVien->id]);
        $dk2 = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop2->id, 'sinh_vien_id' => $sinhVien->id, 'trang_thai' => DangKyHocPhan::ACTIVE]);

        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dk2->id,
            'diem_tong_ket' => 9.0,
            'diem_he_4' => 4.0,
            'ket_qua' => Diem::DAT,
        ]);

        // Sinh viên gọi GET /api/me/gpa
        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/me/gpa')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.hoc_ky_hien_tai.id', $this->hocKy->id)
            ->assertJsonPath('data.hoc_ky_hien_tai.gpa_he_4', 4)
            ->assertJsonPath('data.tich_luy.gpa_he_10', 8)
            ->assertJsonPath('data.tich_luy.gpa_he_4', 3.5)
            ->assertJsonPath('data.tich_luy.tong_tin_chi', 3)
            ->assertJsonPath('data.tich_luy.tin_chi_dat', 3)
            ->assertJsonPath('data.tich_luy.so_hoc_ky_da_tinh', 1);
    }
}
