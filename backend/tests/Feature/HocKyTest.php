<?php

namespace Tests\Feature;

use App\Models\CauHinh;
use App\Models\HocKy;
use App\Models\QuyDoiDiem;
use App\Models\User;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HocKyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_tao_hoc_ky_moi_qua_post(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/semesters', [
                'ma_hoc_ky' => '2027-1',
                'ten_hoc_ky' => 'Học kỳ 1 năm học 2027-2028',
                'nam_hoc' => '2027-2028',
                'ky_thu' => 1,
                'ngay_bat_dau' => '2027-09-01',
                'ngay_ket_thuc' => '2027-12-31',
                'mo_dang_ky_luc' => '2027-08-20 08:00:00',
                'dong_dang_ky_luc' => '2027-08-31 17:00:00',
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_hoc_ky', '2027-1')
            ->assertJsonPath('data.trang_thai', HocKy::UPCOMING);

        $this->assertDatabaseHas('hoc_ky', ['ma_hoc_ky' => '2027-1']);
    }

    public function test_bao_ro_hoc_ky_va_khoang_ngay_bi_chong_lan(): void
    {
        HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2026-2027',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2026-11-18',
            'ngay_ket_thuc' => '2026-11-21',
        ]);

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->postJson('/api/semesters', [
                'ma_hoc_ky' => '2026-3',
                'ten_hoc_ky' => 'Học kỳ 3 năm học 2026-2027',
                'nam_hoc' => '2026-2027',
                'ky_thu' => 3,
                'ngay_bat_dau' => '2026-11-12',
                'ngay_ket_thuc' => '2026-11-25',
                'mo_dang_ky_luc' => '2026-11-09 09:21:00',
                'dong_dang_ky_luc' => '2026-11-10 09:21:00',
            ])
            ->assertStatus(409)
            ->assertJsonPath(
                'message',
                'Khoảng ngày 2026-11-12 đến 2026-11-25 bị chồng lấn với học kỳ 2026-1 - Học kỳ 1 năm học 2026-2027 (2026-11-18 đến 2026-11-21).',
            )
            ->assertJsonPath('errors.hoc_ky_trung.ma_hoc_ky', '2026-1')
            ->assertJsonPath('errors.hoc_ky_trung.ngay_bat_dau', '2026-11-18')
            ->assertJsonPath('errors.hoc_ky_trung.ngay_ket_thuc', '2026-11-21');
    }

    public function test_luong_tao_hoc_ky_luu_cau_hinh_roi_bat_dau_ky(): void
    {
        $admin = User::factory()->admin()->create();
        $this->seed(CauHinhSeeder::class);
        $this->actingAs($admin, 'sanctum');

        $hocKy = $this->postJson('/api/semesters', [
            'ma_hoc_ky' => '2029-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2029-2030',
            'nam_hoc' => '2029-2030',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2029-09-03',
            'ngay_ket_thuc' => '2030-01-12',
            'mo_dang_ky_luc' => '2029-07-01 08:00:00',
            'dong_dang_ky_luc' => '2029-09-03 17:00:00',
        ])->assertCreated()->json('data');

        $hocKyId = $hocKy['id'];
        $macDinh = $this->getJson("/api/settings?hoc_ky_id={$hocKyId}")->assertOk()->json('data');
        $this->assertNull($macDinh['diem.cau_hinh_hoc_ky']);
        $this->assertSame(0.5, $macDinh['diem.trong_so']['cuoi_ky']);

        $daLuu = $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKyId,
            'diem.trong_so' => ['chuyen_can' => 0.2, 'giua_ky' => 0.3, 'cuoi_ky' => 0.5],
        ])->assertOk()->json('data');
        $this->assertSame($hocKyId, $daLuu['diem.cau_hinh_hoc_ky']['hoc_ky_id']);

        $this->patchJson("/api/semesters/{$hocKyId}/status", ['trang_thai' => HocKy::ONGOING])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', HocKy::ONGOING);

        $this->putJson('/api/settings', [
            'hoc_ky_id' => $hocKyId,
            'diem.trong_so' => ['chuyen_can' => 0.25, 'giua_ky' => 0.25, 'cuoi_ky' => 0.5],
        ])->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CONFIG_LOCKED');

        $this->assertDatabaseCount('quy_doi_diem', 1);
        $docLai = $this->getJson("/api/settings?hoc_ky_id={$hocKyId}")->assertOk()->json('data');
        $this->assertSame(0.2, $docLai['diem.trong_so']['chuyen_can']);
    }

    public function test_chi_admin_duoc_tao_hoc_ky(): void
    {
        $this->actingAs(User::factory()->giangVien()->create(), 'sanctum')
            ->postJson('/api/semesters', [])
            ->assertForbidden();
    }

    public function test_khong_cho_dong_dot_dang_ky_sau_ngay_bat_dau_hoc_ky(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->postJson('/api/semesters', [
                'ma_hoc_ky' => '2027-1',
                'ten_hoc_ky' => 'Học kỳ 1 năm học 2027-2028',
                'nam_hoc' => '2027-2028',
                'ky_thu' => 1,
                'ngay_bat_dau' => '2027-09-01',
                'ngay_ket_thuc' => '2027-12-31',
                'mo_dang_ky_luc' => '2027-08-20 08:00:00',
                'dong_dang_ky_luc' => '2027-09-02 17:00:00',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['dong_dang_ky_luc']);
    }

    public function test_admin_sua_chuyen_trang_thai_va_xoa_hoc_ky_theo_dung_vong_doi(): void
    {
        $admin = User::factory()->admin()->create();
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2028-1',
            'nam_hoc' => '2028-2029',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2028-09-01',
            'ngay_ket_thuc' => '2028-12-31',
            'mo_dang_ky_luc' => '2028-08-20 08:00:00',
            'dong_dang_ky_luc' => '2028-08-31 17:00:00',
        ]);
        $input = [
            'ma_hoc_ky' => '2028-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2028-2029 đã cập nhật',
            'nam_hoc' => '2028-2029',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2028-09-01',
            'ngay_ket_thuc' => '2028-12-31',
            'mo_dang_ky_luc' => '2028-08-20 08:00:00',
            'dong_dang_ky_luc' => '2028-08-31 17:00:00',
        ];

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/semesters/{$hocKy->id}", $input)
            ->assertOk()
            ->assertJsonPath('data.ten_hoc_ky', $input['ten_hoc_ky']);

        $this->patchJson("/api/semesters/{$hocKy->id}/status", ['trang_thai' => HocKy::ONGOING])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CONFIG_REQUIRED');

        $this->seed(CauHinhSeeder::class);
        QuyDoiDiem::query()->create([
            'hoc_ky_id' => $hocKy->id,
            'trong_so' => CauHinh::lay('diem.trong_so'),
            'bang_quy_doi' => CauHinh::lay('diem.bang_quy_doi'),
            'so_ngay_sua_diem_danh' => 7,
        ]);
        $this->patchJson("/api/semesters/{$hocKy->id}/status", ['trang_thai' => HocKy::ONGOING])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', HocKy::ONGOING);

        $this->patchJson("/api/semesters/{$hocKy->id}/status", ['trang_thai' => HocKy::UPCOMING])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_TRANSITION_INVALID');

        $this->deleteJson("/api/semesters/{$hocKy->id}")
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');
    }

    public function test_admin_xoa_hoc_ky_sap_dien_ra_chua_co_lop(): void
    {
        $hocKy = HocKy::factory()->create();

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->deleteJson("/api/semesters/{$hocKy->id}")
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('hoc_ky', ['id' => $hocKy->id]);
    }

    public function test_danh_sach_hoc_ky_loc_tim_kiem_phan_trang_va_an_ban_ghi_da_xoa(): void
    {
        $hocKy = HocKy::factory()->create([
            'ma_hoc_ky' => '2026-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2026-2027',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 1,
            'trang_thai' => HocKy::ONGOING,
        ]);
        HocKy::factory()->create([
            'ma_hoc_ky' => '2026-2',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 2,
            'trang_thai' => HocKy::UPCOMING,
        ]);
        HocKy::factory()->create([
            'ma_hoc_ky' => '2025-1',
            'nam_hoc' => '2025-2026',
            'ky_thu' => 1,
            'trang_thai' => HocKy::ONGOING,
        ])->delete();

        $this->actingAs(User::factory()->giangVien()->create(), 'sanctum')
            ->getJson('/api/semesters?q=2026-1&nam_hoc=2026-2027&ky_thu=1&trang_thai=ONGOING&sort_by=ma_hoc_ky&per_page=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('data.0.id', $hocKy->id)
            ->assertJsonPath('data.0.ma_hoc_ky', '2026-1')
            ->assertJsonPath('data.0.nam_hoc', '2026-2027')
            ->assertJsonPath('data.0.ky_thu', 1)
            ->assertJsonPath('data.0.trang_thai', HocKy::ONGOING)
            ->assertJsonStructure([
                'data' => [[
                    'ngay_bat_dau',
                    'ngay_ket_thuc',
                    'mo_dang_ky_luc',
                    'dong_dang_ky_luc',
                    'dang_mo_dang_ky',
                ]],
                'links' => ['first', 'prev', 'next', 'last'],
            ]);
    }

    public function test_danh_sach_hoc_ky_tu_choi_tham_so_loc_va_sap_xep_khong_hop_le(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->getJson('/api/semesters?ky_thu=4&sort_by=unexpected')
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonPath('errors.ky_thu.0', 'kỳ thứ được chọn không hợp lệ.');
    }

    public function test_xem_chi_tiet_hoc_ky_tra_du_thong_tin_cho_moi_vai_tro(): void
    {
        $hocKy = HocKy::factory()->dangDienRa()->create([
            'ma_hoc_ky' => '2026-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2026-2027',
            'nam_hoc' => '2026-2027',
            'ky_thu' => 1,
        ]);

        $this->actingAs(User::factory()->giangVien()->create(), 'sanctum')
            ->getJson("/api/semesters/{$hocKy->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $hocKy->id)
            ->assertJsonPath('data.ma_hoc_ky', '2026-1')
            ->assertJsonPath('data.ten_hoc_ky', 'Học kỳ 1 năm học 2026-2027')
            ->assertJsonPath('data.nam_hoc', '2026-2027')
            ->assertJsonPath('data.ky_thu', 1)
            ->assertJsonPath('data.trang_thai', HocKy::ONGOING)
            ->assertJsonPath('data.dang_mo_dang_ky', true)
            ->assertJsonStructure(['data' => [
                'ngay_bat_dau',
                'ngay_ket_thuc',
                'mo_dang_ky_luc',
                'dong_dang_ky_luc',
            ]]);
    }

    public function test_chi_tiet_hoc_ky_da_xoa_mem_tra_ve_404(): void
    {
        $hocKy = HocKy::factory()->create();
        $hocKy->delete();

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->getJson("/api/semesters/{$hocKy->id}")
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'NOT_FOUND');
    }

    public function test_ma_hoc_ky_sai_dinh_dang_tra_loi_tieng_viet(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->postJson('/api/semesters', [
                'ma_hoc_ky' => '2026-30',
                'ten_hoc_ky' => 'Học kỳ test năm học 2026-2027',
                'nam_hoc' => '2026-2027',
                'ky_thu' => 3,
                'ngay_bat_dau' => '2026-11-12',
                'ngay_ket_thuc' => '2026-11-25',
                'mo_dang_ky_luc' => '2026-11-09 09:21:00',
                'dong_dang_ky_luc' => '2026-11-10 09:21:00',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.ma_hoc_ky.0', 'Mã học kỳ phải có dạng YYYY-N, với N từ 1 đến 3.');
    }

    public function test_ma_hoc_ky_ky_thu_ba_co_the_dung_ma_2026_3(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->postJson('/api/semesters', [
                'ma_hoc_ky' => '2026-3',
                'ten_hoc_ky' => 'Học kỳ 3 năm học 2026-2027',
                'nam_hoc' => '2026-2027',
                'ky_thu' => 3,
                'ngay_bat_dau' => '2026-11-12',
                'ngay_ket_thuc' => '2026-11-25',
                'mo_dang_ky_luc' => '2026-11-09 09:21:00',
                'dong_dang_ky_luc' => '2026-11-10 09:21:00',
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_hoc_ky', '2026-3');
    }
}
