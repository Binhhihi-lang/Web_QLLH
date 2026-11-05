<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\DiemDanh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Module lớp học phần — SCR-25 → SCR-29, SCR-40/SCR-41.
 * Bao phủ FR-08.01/08.02/08.03/08.04/08.05/08.06, BR-03, BR-14, BR-29.
 */
class LopHocPhanTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private HocKy $hocKy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
        $this->hocKy = HocKy::factory()->dangDienRa()->create();
    }

    /**
     * @param  array<string, mixed>  $ghiDe
     * @return array<string, mixed>
     */
    private function duLieuLop(array $ghiDe = []): array
    {
        return array_merge([
            'ma_lop_hp' => 'INT3306-01',
            'mon_hoc_id' => MonHoc::factory()->create(['trang_thai' => true, 'so_tin_chi' => 3])->id,
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => GiangVien::factory()->create(['trang_thai' => true])->id,
            'si_so_toi_da' => 40,
            'nam_thu' => 3,
        ], $ghiDe);
    }

    /**
     * Giảng viên có hồ sơ gắn đúng tài khoản — cần cho Policy BR-03.
     *
     * @return array{0: User, 1: GiangVien}
     */
    private function giangVienCoTaiKhoan(): array
    {
        $taiKhoan = User::factory()->giangVien()->create(['must_change_password' => false]);
        $giangVien = GiangVien::factory()->create([
            'user_id' => $taiKhoan->id,
            'trang_thai' => true,
        ]);

        return [$taiKhoan, $giangVien];
    }

    public function test_admin_mo_lop_chi_tiet_va_cap_nhat_duoc(): void
    {
        $duLieu = $this->duLieuLop();

        $lopId = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/sections', $duLieu)
            ->assertCreated()
            ->assertJsonPath('data.ma_lop_hp', 'INT3306-01')
            ->assertJsonPath('data.si_so_toi_da', 40)
            ->assertJsonPath('data.si_so_hien_tai', 0)
            ->assertJsonPath('data.con_cho', 40)
            ->assertJsonPath('data.trang_thai', LopHocPhan::OPEN)
            ->assertJsonPath('data.da_chot_diem', false)
            ->assertJsonPath('data.da_xoa', false)
            ->json('data.id');

        $this->getJson("/api/sections/{$lopId}")
            ->assertOk()
            ->assertJsonPath('data.mon_hoc.so_tin_chi', 3)
            ->assertJsonPath('data.hoc_ky.trang_thai', HocKy::ONGOING);

        $this->putJson("/api/sections/{$lopId}", array_merge($duLieu, [
            'si_so_toi_da' => 60,
            'nam_thu' => 4,
        ]))
            ->assertOk()
            ->assertJsonPath('data.si_so_toi_da', 60)
            ->assertJsonPath('data.nam_thu', 4);

        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'lop_hoc_phan',
            'doi_tuong_id' => $lopId,
            'hanh_dong' => NhatKy::TAO,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'lop_hoc_phan',
            'doi_tuong_id' => $lopId,
            'hanh_dong' => NhatKy::CAP_NHAT,
        ]);
    }

    public function test_ma_lop_trung_trong_hoc_ky_bi_tu_choi_ke_ca_ban_ghi_da_xoa_mem(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/sections', $this->duLieuLop())
            ->assertCreated();

        // Xóa mềm: mã lớp vẫn giữ chỗ vì unique index của bảng không lọc deleted_at (BR-01).
        LopHocPhan::query()->firstOrFail()->delete();

        $this->postJson('/api/sections', $this->duLieuLop())
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        // Cùng mã nhưng khác học kỳ thì hợp lệ.
        $this->postJson('/api/sections', $this->duLieuLop([
            'hoc_ky_id' => HocKy::factory()->create()->id,
        ]))->assertCreated();
    }

    public function test_khong_gan_duoc_mon_hoac_giang_vien_ngung_hoat_dong(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $this->postJson('/api/sections', $this->duLieuLop([
            'mon_hoc_id' => MonHoc::factory()->create(['trang_thai' => false])->id,
        ]))
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonPath('errors.mon_hoc_id.0', 'Môn học đang ở trạng thái ngừng hoạt động.');

        $this->postJson('/api/sections', $this->duLieuLop([
            'giang_vien_id' => GiangVien::factory()->create(['trang_thai' => false])->id,
        ]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.giang_vien_id.0', 'Giảng viên đang ở trạng thái ngừng hoạt động.');
    }

    public function test_khong_giam_si_so_toi_da_duoi_so_dang_ky_active(): void
    {
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id, 'si_so_toi_da' => 40]);
        DangKyHocPhan::factory()->count(3)->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/sections/{$lop->id}", [
                'ma_lop_hp' => $lop->ma_lop_hp,
                'mon_hoc_id' => $lop->mon_hoc_id,
                'hoc_ky_id' => $lop->hoc_ky_id,
                'giang_vien_id' => $lop->giang_vien_id,
                'si_so_toi_da' => 2,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonPath('errors.si_so_toi_da.0', 'Sĩ số tối đa không được nhỏ hơn số đăng ký hiện tại (3).');

        // Bằng đúng số đăng ký thì hợp lệ.
        $this->putJson("/api/sections/{$lop->id}", [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => $lop->mon_hoc_id,
            'hoc_ky_id' => $lop->hoc_ky_id,
            'giang_vien_id' => $lop->giang_vien_id,
            'si_so_toi_da' => 3,
        ])->assertOk();
    }

    public function test_doi_mon_hoac_hoc_ky_bi_chan_khi_lop_da_co_dang_ky(): void
    {
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id]);
        DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($this->admin, 'sanctum');

        $this->putJson("/api/sections/{$lop->id}", [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => MonHoc::factory()->create()->id,
            'hoc_ky_id' => $lop->hoc_ky_id,
            'giang_vien_id' => $lop->giang_vien_id,
            'si_so_toi_da' => 40,
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SUBJECT_CHANGE_BLOCKED');

        $this->putJson("/api/sections/{$lop->id}", [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => $lop->mon_hoc_id,
            'hoc_ky_id' => HocKy::factory()->create()->id,
            'giang_vien_id' => $lop->giang_vien_id,
            'si_so_toi_da' => 40,
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CHANGE_BLOCKED');
    }

    public function test_doi_giang_vien_trung_lich_tra_409_kem_danh_sach_xung_dot(): void
    {
        $phong = PhongHoc::factory()->create();
        $giangVienMoi = GiangVien::factory()->create(['trang_thai' => true]);

        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'phong_hoc_id' => $phong->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '07:30:00',
            'gio_ket_thuc' => '09:30:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        // Lớp khác của giảng viên mới, trùng đúng ngày và khung giờ.
        $lopKhac = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVienMoi->id,
        ]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopKhac->id,
            'phong_hoc_id' => PhongHoc::factory()->create()->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '08:00:00',
            'gio_ket_thuc' => '10:00:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/sections/{$lop->id}", [
                'ma_lop_hp' => $lop->ma_lop_hp,
                'mon_hoc_id' => $lop->mon_hoc_id,
                'hoc_ky_id' => $lop->hoc_ky_id,
                'giang_vien_id' => $giangVienMoi->id,
                'si_so_toi_da' => 40,
            ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT')
            ->assertJsonPath('errors.trung_lich.0.loai', 'giang_vien')
            ->assertJsonPath('errors.trung_lich.0.doi_tuong', $giangVienMoi->ma_gv);

        // Giảng viên rảnh lịch thì đổi được.
        $giangVienRanh = GiangVien::factory()->create(['trang_thai' => true]);

        $this->putJson("/api/sections/{$lop->id}", [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => $lop->mon_hoc_id,
            'hoc_ky_id' => $lop->hoc_ky_id,
            'giang_vien_id' => $giangVienRanh->id,
            'si_so_toi_da' => 40,
        ])->assertOk()
            ->assertJsonPath('data.giang_vien.id', $giangVienRanh->id);
    }

    public function test_xoa_lop_chan_khi_con_dang_ky_active_va_xoa_kem_buoi_hoc(): void
    {
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id]);
        $buoi = BuoiHoc::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($this->admin, 'sanctum');

        $this->deleteJson("/api/sections/{$lop->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        // Hủy đăng ký rồi thì xóa được; buổi học của lớp bị xóa mềm theo.
        $dangKy->update(['trang_thai' => DangKyHocPhan::CANCELLED]);

        $this->deleteJson("/api/sections/{$lop->id}")->assertOk();

        $this->assertSoftDeleted('lop_hoc_phan', [
            'id' => $lop->id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertSoftDeleted('buoi_hoc', ['id' => $buoi->id]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'lop_hoc_phan',
            'doi_tuong_id' => $lop->id,
            'hanh_dong' => NhatKy::XOA,
        ]);
    }

    public function test_huy_lop_da_chot_diem_bi_chan_cho_toi_khi_mo_khoa(): void
    {
        $lop = LopHocPhan::factory()->daChotDiem()->create(['hoc_ky_id' => $this->hocKy->id]);

        $this->actingAs($this->admin, 'sanctum');

        $this->patchJson("/api/sections/{$lop->id}/status", ['trang_thai' => LopHocPhan::CANCELLED])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'GRADE_LOCKED');

        // Mở khóa điểm cần lý do, và có ghi nhật ký.
        $this->postJson("/api/sections/{$lop->id}/unlock", [])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        $this->postJson("/api/sections/{$lop->id}/unlock", ['ly_do' => 'Chấm sót điểm'])
            ->assertOk()
            ->assertJsonPath('data.da_chot_diem', false);

        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'lop_hoc_phan',
            'doi_tuong_id' => $lop->id,
            'hanh_dong' => NhatKy::MO_KHOA,
            'ghi_chu' => 'Chấm sót điểm',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $this->patchJson("/api/sections/{$lop->id}/status", ['trang_thai' => LopHocPhan::CANCELLED])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', LopHocPhan::CANCELLED);
    }

    public function test_chuyen_sang_cancelled_huy_dang_ky_active_va_buoi_scheduled(): void
    {
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        $dangKyDaHuy = DangKyHocPhan::factory()->daHuy()->create(['lop_hoc_phan_id' => $lop->id]);
        $buoiScheduled = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        $buoiDaDay = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => BuoiHoc::DONE,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/sections/{$lop->id}/status", ['trang_thai' => LopHocPhan::CANCELLED])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', LopHocPhan::CANCELLED);

        $this->assertDatabaseHas('dang_ky_hoc_phan', [
            'id' => $dangKy->id,
            'trang_thai' => DangKyHocPhan::CANCELLED,
            'huy_boi' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('buoi_hoc', [
            'id' => $buoiScheduled->id,
            'trang_thai' => BuoiHoc::CANCELLED,
        ]);
        // Buổi đã dạy không bị đụng tới.
        $this->assertDatabaseHas('buoi_hoc', [
            'id' => $buoiDaDay->id,
            'trang_thai' => BuoiHoc::DONE,
        ]);
        // Đăng ký đã hủy trước đó giữ nguyên người hủy cũ.
        $this->assertDatabaseMissing('dang_ky_hoc_phan', [
            'id' => $dangKyDaHuy->id,
            'huy_boi' => $this->admin->id,
        ]);
    }

    public function test_chot_diem_yeu_cau_du_diem_thanh_phan(): void
    {
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        Diem::factory()->create(['dang_ky_hoc_phan_id' => $dangKy->id]);

        $this->actingAs($taiKhoan, 'sanctum');

        $this->postJson("/api/sections/{$lop->id}/finalize")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'GRADE_INCOMPLETE')
            ->assertJsonPath('errors.thieu_diem.0.dang_ky_hoc_phan_id', $dangKy->id);

        $dangKy->diem->update([
            'diem_chuyen_can' => 8.5,
            'diem_giua_ky' => 7.0,
            'diem_cuoi_ky' => 8.0,
        ]);

        $this->postJson("/api/sections/{$lop->id}/finalize")
            ->assertOk()
            ->assertJsonPath('data.da_chot_diem', true)
            ->assertJsonPath('data.so_dong_diem', 1);

        $this->assertNotNull($lop->fresh()->chot_diem_luc);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'lop_hoc_phan',
            'doi_tuong_id' => $lop->id,
            'hanh_dong' => NhatKy::CHOT_DIEM,
            'nguoi_thuc_hien_id' => $taiKhoan->id,
        ]);

        // Chốt lần hai bị chặn.
        $this->postJson("/api/sections/{$lop->id}/finalize")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'GRADE_LOCKED');
    }

    public function test_chot_diem_bi_chan_khi_lop_khong_co_dang_ky_active(): void
    {
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        DangKyHocPhan::factory()->daHuy()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->postJson("/api/sections/{$lop->id}/finalize")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'NO_ACTIVE_ENROLLMENTS');

        $this->assertFalse($lop->fresh()->daChotDiem());
    }

    public function test_giang_vien_phu_trach_luu_diem_hang_loat(): void
    {
        CauHinh::dat('diem.trong_so', [
            'chuyen_can' => 0.25,
            'giua_ky' => 0.25,
            'cuoi_ky' => 0.50,
        ]);
        CauHinh::dat('diem.bang_quy_doi', [
            ['tu' => 8.5, 'den' => 10.0, 'chu' => 'A', 'he_4' => 4.0, 'xep_loai' => 'Giỏi', 'dat' => true],
            ['tu' => 8.0, 'den' => 8.49, 'chu' => 'B+', 'he_4' => 3.5, 'xep_loai' => 'Khá giỏi', 'dat' => true],
            ['tu' => 7.0, 'den' => 7.99, 'chu' => 'B', 'he_4' => 3.0, 'xep_loai' => 'Khá', 'dat' => true],
            ['tu' => 6.5, 'den' => 6.99, 'chu' => 'C+', 'he_4' => 2.5, 'xep_loai' => 'Trung bình khá', 'dat' => true],
            ['tu' => 5.5, 'den' => 6.49, 'chu' => 'C', 'he_4' => 2.0, 'xep_loai' => 'Trung bình', 'dat' => true],
            ['tu' => 5.0, 'den' => 5.49, 'chu' => 'D+', 'he_4' => 1.5, 'xep_loai' => 'Trung bình yếu', 'dat' => true],
            ['tu' => 4.0, 'den' => 4.99, 'chu' => 'D', 'he_4' => 1.0, 'xep_loai' => 'Yếu', 'dat' => true],
            ['tu' => 0.0, 'den' => 3.99, 'chu' => 'F', 'he_4' => 0.0, 'xep_loai' => 'Kém (không đạt)', 'dat' => false],
        ]);

        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", [
                'diem' => [[
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'diem_chuyen_can' => 8.0,
                    'diem_giua_ky' => 7.5,
                    'diem_cuoi_ky' => 9.0,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.dang_ky_hoc_phan_id', $dangKy->id)
            ->assertJsonPath('data.0.diem_chuyen_can', 8)
            ->assertJsonPath('data.0.diem_tong_ket', 8.38)
            ->assertJsonPath('data.0.diem_chu', 'B+')
            ->assertJsonPath('data.0.diem_he_4', 3.5)
            ->assertJsonPath('data.0.xep_loai', 'Khá giỏi')
            ->assertJsonPath('data.0.ket_qua', Diem::DAT);

        $this->assertDatabaseHas('diem', [
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_chuyen_can' => 8.00,
            'diem_giua_ky' => 7.50,
            'diem_cuoi_ky' => 9.00,
            'diem_tong_ket' => 8.38,
            'diem_chu' => 'B+',
            'diem_he_4' => 3.50,
            'xep_loai' => 'Khá giỏi',
            'ket_qua' => Diem::DAT,
        ]);

        $this->putJson("/api/sections/{$lop->id}/grades", [
            'ly_do' => 'Điều chỉnh sau phúc khảo',
            'diem' => [[
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'diem_chuyen_can' => 9.0,
                'diem_giua_ky' => 7.5,
                'diem_cuoi_ky' => 9.0,
            ]],
        ])->assertOk();

        $this->assertDatabaseHas('lich_su_diem', [
            'truong' => 'diem_chuyen_can',
            'gia_tri_cu' => '8.00',
            'gia_tri_moi' => '9.00',
            'nguoi_sua_id' => $taiKhoan->id,
            'ly_do' => 'Điều chỉnh sau phúc khảo',
        ]);
    }

    public function test_gui_lai_diem_khong_thay_doi_khong_tinh_lai_ket_qua_legacy(): void
    {
        $this->seed(CauHinhSeeder::class);
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_chuyen_can' => 8,
            'diem_giua_ky' => 7.5,
            'diem_cuoi_ky' => 9,
            'diem_tong_ket' => 9.25,
            'diem_chu' => 'A',
            'xep_loai' => 'Kết quả lịch sử',
            'diem_he_4' => 3.75,
            'ket_qua' => Diem::DAT,
        ]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", [
                'diem' => [[
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'diem_chuyen_can' => 8,
                    'diem_giua_ky' => 7.5,
                    'diem_cuoi_ky' => 9,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.diem_tong_ket', 9.25)
            ->assertJsonPath('data.0.diem_chu', 'A')
            ->assertJsonPath('data.0.xep_loai', 'Kết quả lịch sử');

        $this->assertDatabaseHas('diem', [
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_tong_ket' => 9.25,
            'diem_chu' => 'A',
            'xep_loai' => 'Kết quả lịch sử',
            'quy_doi_diem_id' => null,
        ]);
    }

    public function test_giang_vien_khong_phu_trach_khong_duoc_luu_diem(): void
    {
        [, $giangVienPhuTrach] = $this->giangVienCoTaiKhoan();
        [$taiKhoanKhac] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVienPhuTrach->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($taiKhoanKhac, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", [
                'diem' => [[
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'diem_chuyen_can' => 8,
                    'diem_giua_ky' => 8,
                    'diem_cuoi_ky' => 8,
                ]],
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('diem', [
            'dang_ky_hoc_phan_id' => $dangKy->id,
        ]);
    }

    public function test_diem_chua_du_thanh_phan_duoc_luu_nhung_chua_tinh_tong(): void
    {
        CauHinh::dat('diem.trong_so', [
            'chuyen_can' => 0.25,
            'giua_ky' => 0.25,
            'cuoi_ky' => 0.50,
        ]);
        CauHinh::dat('diem.bang_quy_doi', [
            ['tu' => 0, 'den' => 10, 'chu' => 'A', 'he_4' => 4, 'xep_loai' => 'Giỏi', 'dat' => true],
        ]);
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", [
                'diem' => [[
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'diem_chuyen_can' => 8,
                    'diem_giua_ky' => null,
                    'diem_cuoi_ky' => null,
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.0.diem_chuyen_can', 8)
            ->assertJsonPath('data.0.diem_giua_ky', null)
            ->assertJsonPath('data.0.diem_tong_ket', null)
            ->assertJsonPath('data.0.diem_chu', null);
    }

    public function test_diem_hang_loat_tu_choi_dang_ky_cua_lop_khac(): void
    {
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $lopKhac = LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id]);
        $dangKyLopKhac = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lopKhac->id]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", [
                'diem' => [[
                    'dang_ky_hoc_phan_id' => $dangKyLopKhac->id,
                    'diem_chuyen_can' => 8,
                    'diem_giua_ky' => 8,
                    'diem_cuoi_ky' => 8,
                ]],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['diem.0.dang_ky_hoc_phan_id']);

        $this->assertDatabaseMissing('diem', [
            'dang_ky_hoc_phan_id' => $dangKyLopKhac->id,
        ]);
    }

    public function test_luu_diem_bi_chan_voi_hoc_ky_da_dong_hoac_lop_da_chot(): void
    {
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lopHocKyDong = LopHocPhan::factory()->create([
            'hoc_ky_id' => HocKy::factory()->create(['trang_thai' => HocKy::CLOSED])->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $lopDaChot = LopHocPhan::factory()->daChotDiem()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKyHocKyDong = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lopHocKyDong->id]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lopDaChot->id]);
        $payloadHocKyDong = ['diem' => [[
            'dang_ky_hoc_phan_id' => $dangKyHocKyDong->id,
            'diem_chuyen_can' => 8,
            'diem_giua_ky' => 8,
            'diem_cuoi_ky' => 8,
        ]]];
        $payloadLopDaChot = ['diem' => [[
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_chuyen_can' => 8,
            'diem_giua_ky' => 8,
            'diem_cuoi_ky' => 8,
        ]]];

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lopHocKyDong->id}/grades", $payloadHocKyDong)
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        $this->putJson("/api/sections/{$lopDaChot->id}/grades", $payloadLopDaChot)
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'GRADE_LOCKED');

        $this->assertDatabaseMissing('diem', [
            'dang_ky_hoc_phan_id' => $dangKy->id,
        ]);
    }

    public function test_diem_hang_loat_tu_choi_dong_khong_dung_dinh_dang(): void
    {
        [$taiKhoan, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);

        $this->actingAs($taiKhoan, 'sanctum')
            ->putJson("/api/sections/{$lop->id}/grades", ['diem' => ['sai-dinh-dang']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['diem.0']);
    }

    public function test_hoc_ky_closed_chi_doc_voi_moi_thao_tac_ghi(): void
    {
        $hocKyDong = HocKy::factory()->create(['trang_thai' => HocKy::CLOSED]);
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $hocKyDong->id]);

        $this->actingAs($this->admin, 'sanctum');

        $this->postJson('/api/sections', $this->duLieuLop(['hoc_ky_id' => $hocKyDong->id]))
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        $this->putJson("/api/sections/{$lop->id}", [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => $lop->mon_hoc_id,
            'hoc_ky_id' => $hocKyDong->id,
            'giang_vien_id' => $lop->giang_vien_id,
            'si_so_toi_da' => 40,
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        $this->patchJson("/api/sections/{$lop->id}/status", ['trang_thai' => LopHocPhan::CLOSED])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        $this->deleteJson("/api/sections/{$lop->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        $this->assertNull($lop->fresh()->deleted_at);
    }

    public function test_phan_quyen_theo_ma_tran_hop_dong(): void
    {
        [$taiKhoanGv, $giangVien] = $this->giangVienCoTaiKhoan();
        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dangKy = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_chuyen_can' => 8,
            'diem_giua_ky' => 8,
            'diem_cuoi_ky' => 8,
        ]);

        $duLieu = [
            'ma_lop_hp' => $lop->ma_lop_hp,
            'mon_hoc_id' => $lop->mon_hoc_id,
            'hoc_ky_id' => $lop->hoc_ky_id,
            'giang_vien_id' => $lop->giang_vien_id,
            'si_so_toi_da' => 40,
        ];

        // PUT /sections/{id}: ADMIN 200, TEACHER 403, STUDENT 403
        $this->actingAs($taiKhoanGv, 'sanctum')->putJson("/api/sections/{$lop->id}", $duLieu)->assertForbidden();
        $this->actingAs($sinhVien, 'sanctum')->putJson("/api/sections/{$lop->id}", $duLieu)->assertForbidden();
        $this->actingAs($this->admin, 'sanctum')->putJson("/api/sections/{$lop->id}", $duLieu)->assertOk();

        // POST /sections/{id}/finalize: permission matrix with an eligible ACTIVE enrollment
        $this->actingAs($sinhVien, 'sanctum')->postJson("/api/sections/{$lop->id}/finalize")->assertForbidden();
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/sections/{$lop->id}/finalize")->assertForbidden();
        $this->actingAs($taiKhoanGv, 'sanctum')->postJson("/api/sections/{$lop->id}/finalize")->assertOk();

        // Sinh viên xem được lớp OPEN nhưng không xem được sinh viên/bảng điểm của lớp.
        $this->actingAs($sinhVien, 'sanctum')
            ->getJson("/api/sections/{$lop->id}")
            ->assertOk();
        $this->getJson("/api/sections/{$lop->id}/students")->assertForbidden();
        $this->getJson("/api/sections/{$lop->id}/grades")->assertForbidden();

        // Giảng viên không phụ trách lớp thì không xem được bảng điểm của lớp đó.
        [$taiKhoanGvKhac] = $this->giangVienCoTaiKhoan();
        $this->actingAs($taiKhoanGvKhac, 'sanctum')
            ->getJson("/api/sections/{$lop->id}/grades")
            ->assertForbidden();
    }

    public function test_danh_sach_loc_theo_vai_tro_va_con_cho(): void
    {
        [$taiKhoanGv, $giangVien] = $this->giangVienCoTaiKhoan();
        $taiKhoanSv = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $sinhVien = SinhVien::factory()->create(['user_id' => $taiKhoanSv->id]);

        $lopCuaGv = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
            'ma_lop_hp' => 'GV-01',
            'si_so_toi_da' => 40,
        ]);
        LopHocPhan::factory()->create(['hoc_ky_id' => $this->hocKy->id, 'ma_lop_hp' => 'GV-02']);
        $lopDaDangKy = LopHocPhan::factory()->daDong()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'ma_lop_hp' => 'SV-02',
            'si_so_toi_da' => 1,
        ]);
        DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lopDaDangKy->id,
            'sinh_vien_id' => $sinhVien->id,
        ]);

        // TEACHER chỉ thấy lớp mình phụ trách.
        $this->actingAs($taiKhoanGv, 'sanctum')
            ->getJson('/api/sections')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_lop_hp', 'GV-01')
            ->assertJsonPath('data.0.si_so_hien_tai', 0)
            ->assertJsonPath('data.0.con_cho', 40);

        // STUDENT thấy lớp OPEN, và lớp CLOSED mà mình đã đăng ký — nhưng không thấy lớp GV-02.
        $this->actingAs($taiKhoanSv, 'sanctum')
            ->getJson('/api/sections')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/sections?con_cho=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_sinh_vien_cua_lop_bang_diem_va_thong_ke_chuyen_can(): void
    {
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);

        $dangKyA = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        $dangKyB = DangKyHocPhan::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        // Đăng ký đã hủy không xuất hiện trong danh sách lớp (BR-21).
        DangKyHocPhan::factory()->daHuy()->create(['lop_hoc_phan_id' => $lop->id]);

        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKyA->id,
            'diem_chuyen_can' => 8.5,
            'diem_giua_ky' => 7.0,
            'diem_cuoi_ky' => 8.0,
            'diem_tong_ket' => 7.88,
            'diem_chu' => 'B',
            'xep_loai' => 'Khá',
            'diem_he_4' => 3.0,
            'ket_qua' => Diem::DAT,
        ]);

        $buois = BuoiHoc::factory()->count(10)->create([
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => BuoiHoc::DONE,
        ]);

        // A: 8 PRESENT + 1 LATE + 1 EXCUSED → mẫu số 9, tỷ lệ 1.0
        $buois->each(function (BuoiHoc $buoi, int $thuTu) use ($dangKyA, $dangKyB) {
            $trangThaiA = match (true) {
                $thuTu === 8 => DiemDanh::LATE,
                $thuTu === 9 => DiemDanh::EXCUSED,
                default => DiemDanh::PRESENT,
            };

            DiemDanh::factory()->create([
                'buoi_hoc_id' => $buoi->id,
                'dang_ky_hoc_phan_id' => $dangKyA->id,
                'trang_thai' => $trangThaiA,
            ]);
            DiemDanh::factory()->create([
                'buoi_hoc_id' => $buoi->id,
                'dang_ky_hoc_phan_id' => $dangKyB->id,
                'trang_thai' => DiemDanh::EXCUSED,
            ]);
        });

        $this->actingAs($this->admin, 'sanctum');

        $this->getJson("/api/sections/{$lop->id}/students")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.dang_ky_hoc_phan_id', $dangKyA->id)
            ->assertJsonPath('data.0.ma_sv', $dangKyA->sinhVien->ma_sv);

        $this->getJson("/api/sections/{$lop->id}/grades")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.dang_ky_hoc_phan_id', $dangKyA->id)
            ->assertJsonPath('data.0.diem_chuyen_can', 8.5)
            ->assertJsonPath('data.0.diem_chu', 'B')
            ->assertJsonPath('data.0.ket_qua', Diem::DAT)
            ->assertJsonPath('data.1.diem_chuyen_can', null);

        $this->getJson("/api/sections/{$lop->id}/attendance-summary")
            ->assertOk()
            ->assertJsonPath('data.tong_buoi', 10)
            ->assertJsonPath('data.sinh_vien.0.co_mat', 8)
            ->assertJsonPath('data.sinh_vien.0.di_muon', 1)
            ->assertJsonPath('data.sinh_vien.0.co_phep', 1)
            // json_encode không giữ phần thập phân của số nguyên (1.0 → 1).
            ->assertJsonPath('data.sinh_vien.0.ty_le', 1)
            // Toàn EXCUSED → mẫu số 0 → tỷ lệ null, không chia cho 0.
            ->assertJsonPath('data.sinh_vien.1.ty_le', null);
    }
}
