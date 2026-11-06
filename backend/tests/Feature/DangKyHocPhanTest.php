<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DangKyHocPhanTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_sinh_vien_dang_ky_xem_danh_sach_va_huy_trong_dot(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $sinhVien = SinhVien::factory()->create();

        $dangKyId = $this->actingAs($sinhVien->user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lop->id])
            ->assertCreated()
            ->assertJsonPath('data.trang_thai', DangKyHocPhan::ACTIVE)
            ->json('data.id');

        $this->getJson('/api/me/enrollments')
            ->assertOk()
            ->assertJsonPath('data.0.id', $dangKyId);

        $this->deleteJson("/api/me/enrollments/{$dangKyId}")
            ->assertOk()
            ->assertJsonPath('data.trang_thai', DangKyHocPhan::CANCELLED);

        $this->assertDatabaseHas('dang_ky_hoc_phan', [
            'id' => $dangKyId,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::CANCELLED,
        ]);
    }

    public function test_chan_trung_dang_ky_ngoai_dot_va_day_si_so(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $lopDay = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id, 'si_so_toi_da' => 1]);
        $lopNgoaiDot = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKyTrongTuongLai()->id,
        ]);
        $sinhVien = SinhVien::factory()->create();
        $sinhVienKhac = SinhVien::factory()->create();

        $this->actingAs($sinhVien->user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopNgoaiDot->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'OUTSIDE_REGISTRATION');

        $this->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopDay->id])->assertCreated();
        $this->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopDay->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'DUPLICATE_ENROLLMENT');

        $this->actingAs($sinhVienKhac->user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopDay->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SECTION_FULL');
    }

    public function test_admin_dang_ky_hang_loat_tra_ket_qua_tung_sinh_vien(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id, 'si_so_toi_da' => 2]);
        $sinhVien = SinhVien::factory()->count(3)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/enrollments/bulk', [
                'lop_hoc_phan_id' => $lop->id,
                'sinh_vien_ids' => $sinhVien->pluck('id')->all(),
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 1);

        $this->assertDatabaseCount('dang_ky_hoc_phan', 2);
    }

    public function test_admin_dang_ky_bulk_cho_toan_bo_lop_hanh_chinh(): void
    {
        $lop = LopHocPhan::factory()->create(['si_so_toi_da' => 5]);
        $lopHanhChinh = LopHanhChinh::factory()->create();
        SinhVien::factory()->count(2)->create(['lop_hanh_chinh_id' => $lopHanhChinh->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/enrollments/bulk', [
                'lop_hoc_phan_id' => $lop->id,
                'lop_hanh_chinh_id' => $lopHanhChinh->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 0);

        $this->assertDatabaseCount('dang_ky_hoc_phan', 2);
    }

    public function test_admin_list_endpoint_loc_du_lieu_va_student_khong_duoc_dang_ky_ho(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $sinhVien = SinhVien::factory()->create();

        $this->actingAs($sinhVien->user, 'sanctum')
            ->postJson('/api/enrollments', [
                'sinh_vien_id' => $sinhVien->id,
                'lop_hoc_phan_id' => $lop->id,
            ])
            ->assertForbidden();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/enrollments', [
                'sinh_vien_id' => $sinhVien->id,
                'lop_hoc_phan_id' => $lop->id,
            ])
            ->assertCreated();

        $this->getJson('/api/enrollments?hoc_ky_id='.$hocKy->id.'&trang_thai=ACTIVE')
            ->assertOk()
            ->assertJsonPath('data.0.sinh_vien.id', $sinhVien->id)
            ->assertJsonPath('data.0.lop_hoc_phan.id', $lop->id);
    }

    public function test_chan_huy_khi_da_co_diem_va_cho_admin_huy_ngoai_dot(): void
    {
        $hocKy = $this->hocKyTrongTuongLai();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $sinhVien = SinhVien::factory()->create();
        $dangKy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'dang_ky_boi' => $this->admin->id,
        ]);

        $this->actingAs($sinhVien->user, 'sanctum')
            ->deleteJson("/api/me/enrollments/{$dangKy->id}")
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'OUTSIDE_REGISTRATION');

        $hocKy->update(['mo_dang_ky_luc' => now()->subDay(), 'dong_dang_ky_luc' => now()->addDay()]);
        Diem::query()->create(['dang_ky_hoc_phan_id' => $dangKy->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/enrollments/{$dangKy->id}", ['ly_do' => 'Điều chỉnh danh sách'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'HAS_GRADE_OR_ATTENDANCE');
    }

    public function test_chan_dang_ky_trung_mon_trung_lich_va_sai_nam_thu(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $mon = MonHoc::factory()->create();
        $lopHanhChinh = LopHanhChinh::factory()->create(['nam_nhap_hoc' => 2025]);
        $sinhVien = SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopHanhChinh->id]);
        $lopDaDangKy = LopHocPhan::factory()->create([
            'hoc_ky_id' => $hocKy->id,
            'mon_hoc_id' => $mon->id,
        ]);
        $lopTrungMon = LopHocPhan::factory()->create([
            'hoc_ky_id' => $hocKy->id,
            'mon_hoc_id' => $mon->id,
        ]);

        $this->actingAs($sinhVien->user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopDaDangKy->id])
            ->assertCreated();
        $this->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopTrungMon->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'DUPLICATE_SUBJECT_IN_SEMESTER');

        $lopTrungLich = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $ngay = now()->addWeek()->toDateString();
        $phong = PhongHoc::factory()->create();
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopDaDangKy->id,
            'ngay_hoc' => $ngay,
            'gio_bat_dau' => '09:00',
            'gio_ket_thuc' => '10:00',
            'phong_hoc_id' => $phong->id,
        ]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopTrungLich->id,
            'ngay_hoc' => $ngay,
            'gio_bat_dau' => '09:30',
            'gio_ket_thuc' => '10:30',
            'phong_hoc_id' => $phong->id,
        ]);
        $this->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopTrungLich->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT')
            ->assertJsonPath('errors.trung_lich.0.lop_moi.ma_lop_hp', $lopTrungLich->ma_lop_hp)
            ->assertJsonPath('errors.trung_lich.0.buoi_moi.ngay_hoc', $ngay)
            ->assertJsonPath('errors.trung_lich.0.buoi_moi.gio_bat_dau', '09:30')
            ->assertJsonPath('errors.trung_lich.0.buoi_moi.gio_ket_thuc', '10:30')
            ->assertJsonPath('errors.trung_lich.0.lop_da_dang_ky.ma_lop_hp', $lopDaDangKy->ma_lop_hp)
            ->assertJsonPath('errors.trung_lich.0.buoi_da_dang_ky.ngay_hoc', $ngay)
            ->assertJsonPath('errors.trung_lich.0.buoi_da_dang_ky.gio_bat_dau', '09:00')
            ->assertJsonPath('errors.trung_lich.0.buoi_da_dang_ky.gio_ket_thuc', '10:00');

        $hocKy->update(['nam_hoc' => '2025-2026']);
        $lopSaiNam = LopHocPhan::factory()->create([
            'hoc_ky_id' => $hocKy->id,
            'nam_thu' => 4,
        ]);
        $this->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lopSaiNam->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'WRONG_STUDY_YEAR');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/enrollments', [
                'sinh_vien_id' => $sinhVien->id,
                'lop_hoc_phan_id' => $lopSaiNam->id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'dang_ky_hoc_phan',
            'hanh_dong' => 'TAO',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);
    }

    public function test_dang_ky_lai_sau_huy_dung_lai_ban_ghi_cu(): void
    {
        $hocKy = $this->hocKyTrongDot();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $sinhVien = SinhVien::factory()->create();
        $dangKy = DangKyHocPhan::factory()->daHuy()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
        ]);

        $this->actingAs($sinhVien->user, 'sanctum')
            ->postJson('/api/me/enrollments', ['lop_hoc_phan_id' => $lop->id])
            ->assertCreated()
            ->assertJsonPath('data.id', $dangKy->id)
            ->assertJsonPath('data.trang_thai', DangKyHocPhan::ACTIVE);

        $this->assertDatabaseCount('dang_ky_hoc_phan', 1);
    }

    public function test_admin_duoc_huy_ngoai_dot_va_student_khong_duoc_huy_nguoi_khac(): void
    {
        $hocKy = $this->hocKyTrongTuongLai();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKy->id]);
        $sinhVien = SinhVien::factory()->create();
        $sinhVienKhac = SinhVien::factory()->create();
        $dangKy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'dang_ky_boi' => $this->admin->id,
        ]);

        $this->actingAs($sinhVienKhac->user, 'sanctum')
            ->deleteJson("/api/me/enrollments/{$dangKy->id}")
            ->assertNotFound();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/enrollments/{$dangKy->id}", ['ly_do' => 'Điều chỉnh hành chính'])
            ->assertOk();

        $this->assertDatabaseHas('dang_ky_hoc_phan', [
            'id' => $dangKy->id,
            'trang_thai' => DangKyHocPhan::CANCELLED,
            'ly_do_huy' => 'Điều chỉnh hành chính',
        ]);
    }

    public function test_validate_body_va_giang_vien_chi_xem_dang_ky_lop_cua_minh(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/enrollments', [])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        $this->deleteJson('/api/enrollments/999999999')
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'NOT_FOUND');

        $lop = LopHocPhan::factory()->create();
        $sinhVien = SinhVien::factory()->create();
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'dang_ky_boi' => $this->admin->id,
        ]);
        $giangVienKhac = User::factory()->giangVien()->create();

        $this->actingAs($giangVienKhac, 'sanctum')
            ->getJson('/api/enrollments')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    private function hocKyTrongDot(): HocKy
    {
        return HocKy::factory()->create([
            'mo_dang_ky_luc' => now()->subDay(),
            'dong_dang_ky_luc' => now()->addDay(),
            'trang_thai' => HocKy::UPCOMING,
        ]);
    }

    private function hocKyTrongTuongLai(): HocKy
    {
        return HocKy::factory()->create([
            'mo_dang_ky_luc' => now()->addDay(),
            'dong_dang_ky_luc' => now()->addDays(2),
            'trang_thai' => HocKy::UPCOMING,
        ]);
    }
}
