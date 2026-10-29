<?php

namespace Tests\Feature;

use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_chua_dang_nhap_khong_the_xem_dashboard_admin(): void
    {
        $this->getJson('/api/dashboard/admin')
            ->assertUnauthorized();
    }

    public function test_sinh_vien_va_giang_vien_khong_the_xem_dashboard_admin(): void
    {
        $sinhVienUser = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $giangVienUser = User::factory()->giangVien()->create(['must_change_password' => false]);

        $this->actingAs($sinhVienUser, 'sanctum')
            ->getJson('/api/dashboard/admin')
            ->assertForbidden();

        $this->actingAs($giangVienUser, 'sanctum')
            ->getJson('/api/dashboard/admin')
            ->assertForbidden();
    }

    public function test_admin_xem_dashboard_thanh_cong_dung_cau_truc_hop_dong(): void
    {
        $monHoc = MonHoc::factory()->create(['ten_mon' => 'Lập trình Web']);
        $hocKy = HocKy::factory()->create([
            'ten_hoc_ky' => 'HK1 2026-2027',
            'trang_thai' => HocKy::ONGOING,
        ]);
        $giangVien = GiangVien::factory()->create(['ho_ten' => 'Thầy Giáo Demo']);
        $sinhVien = SinhVien::factory()->create();

        $lop = LopHocPhan::factory()->create([
            'mon_hoc_id' => $monHoc->id,
            'hoc_ky_id' => $hocKy->id,
            'giang_vien_id' => $giangVien->id,
            'si_so_toi_da' => 50,
            'trang_thai' => LopHocPhan::OPEN,
        ]);

        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/admin')
            ->assertOk()
            ->assertJsonPath('success', true);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'the_so_lieu' => [
                    '*' => ['khoa', 'label', 'gia_tri', 'don_vi', 'phu_chu', 'xu_huong'],
                ],
                'ty_le_lap_day' => [
                    '*' => ['hoc_ky', 'tong_cho', 'da_dang_ky'],
                ],
                'lop_sap_mo' => [
                    '*' => ['id', 'ma_lop_hp', 'ten_mon_hoc', 'ten_giang_vien', 'si_so', 'ty_le', 'trang_thai', 'nam_thu'],
                ],
                'dang_ky_gan_day' => [
                    '*' => ['id', 'ma_sv', 'ho_ten', 'ma_lop_hp', 'ten_mon_hoc', 'thoi_gian', 'trang_thai'],
                ],
            ],
        ]);

        $khoas = collect($response->json('data.the_so_lieu'))->pluck('khoa')->all();
        $this->assertContains('sinh_vien', $khoas);
        $this->assertContains('lop_hoc_phan', $khoas);
        $this->assertContains('dang_ky', $khoas);
        $this->assertContains('cho_dang_ky', $khoas);
    }
}

