<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\NhatKy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HocKyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');
    }

    private function duLieu(array $ghiDe = []): array
    {
        return array_replace([
            'ma_hoc_ky' => '2040-1',
            'ten_hoc_ky' => 'Học kỳ 1 năm học 2040-2041',
            'nam_hoc' => '2040-2041',
            'ky_thu' => 1,
            'ngay_bat_dau' => '2040-01-01',
            'ngay_ket_thuc' => '2040-05-31',
            'mo_dang_ky_luc' => '2040-01-01 00:00:00',
            'dong_dang_ky_luc' => '2040-01-31 23:59:59',
        ], $ghiDe);
    }

    private function taoKy(array $ghiDe = []): HocKy
    {
        return HocKy::query()->create($this->duLieu(['trang_thai' => HocKy::UPCOMING, ...$ghiDe]));
    }

    public function test_tao_hoc_ky_upcoming_va_tra_dung_dinh_dang(): void
    {
        $this->postJson('/api/semesters', $this->duLieu())
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.trang_thai', HocKy::UPCOMING)
            ->assertJsonPath('data.ngay_bat_dau', '2040-01-01')
            ->assertJsonPath('data.mo_dang_ky_luc', '2040-01-01 00:00:00')
            ->assertJsonPath('data.dang_mo_dang_ky', false);
        $this->assertDatabaseHas('hoc_ky', ['ma_hoc_ky' => '2040-1', 'ky_thu' => 1]);
    }

    public function test_danh_sach_tim_kiem_loc_sap_xep_va_phan_trang(): void
    {
        $ky = $this->taoKy();
        $this->taoKy(['ma_hoc_ky' => '2041-1', 'nam_hoc' => '2041-2042']);

        $this->getJson('/api/semesters?q=2040&nam_hoc=2040-2041&ky_thu=1&trang_thai=UPCOMING&per_page=10&sort_by=ngay_bat_dau&sort_dir=desc')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ky->id)
            ->assertJsonPath('meta.total', 1)->assertJsonPath('meta.per_page', 10);
    }

    public function test_chi_tiet_va_cap_nhat_khong_tu_trung_voi_chinh_minh(): void
    {
        $ky = $this->taoKy();
        $this->getJson('/api/semesters/'.$ky->id)->assertOk()->assertJsonPath('data.id', $ky->id);
        $this->putJson('/api/semesters/'.$ky->id, $this->duLieu(['ten_hoc_ky' => 'Tên mới']))
            ->assertOk()->assertJsonPath('data.ten_hoc_ky', 'Tên mới');
    }

    public function test_unique_ma_va_to_hop_nam_hoc_ky_thu_ke_ca_da_xoa(): void
    {
        $ky = $this->taoKy();
        $ky->delete();
        $this->postJson('/api/semesters', $this->duLieu())
            ->assertUnprocessable()->assertJsonValidationErrors(['ma_hoc_ky', 'ky_thu']);
    }

    public function test_chan_trung_ngay_ke_ca_chung_mot_ngay_o_bien(): void
    {
        $this->taoKy();
        $this->postJson('/api/semesters', $this->duLieu([
            'ma_hoc_ky' => '2040-2', 'ky_thu' => 2,
            'ngay_bat_dau' => '2040-05-31', 'ngay_ket_thuc' => '2040-10-01',
            'mo_dang_ky_luc' => '2040-05-31 08:00:00', 'dong_dang_ky_luc' => '2040-06-10 12:00:00',
        ]))->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_OVERLAP');
        $this->assertSame(1, HocKy::count());
    }

    public function test_cho_phep_ky_ke_tiep_tu_ngay_hom_sau(): void
    {
        $this->taoKy();
        $this->postJson('/api/semesters', $this->duLieu([
            'ma_hoc_ky' => '2040-2', 'ky_thu' => 2,
            'ngay_bat_dau' => '2040-06-01', 'ngay_ket_thuc' => '2040-10-01',
            'mo_dang_ky_luc' => '2040-06-01 00:00:00', 'dong_dang_ky_luc' => '2040-10-01 23:59:59',
        ]))->assertCreated();
    }

    public function test_khoang_ngay_da_xoa_khong_chan_tao_ky_ma_khac(): void
    {
        $ky = $this->taoKy();
        $ky->delete();
        $this->postJson('/api/semesters', $this->duLieu(['ma_hoc_ky' => '2040-2', 'ky_thu' => 2]))
            ->assertCreated();
    }

    public function test_chan_dot_dang_ky_ngoai_ky_va_ngay_gio_sai(): void
    {
        foreach ([
            ['mo_dang_ky_luc' => '2039-12-31 23:59:59'],
            ['dong_dang_ky_luc' => '2040-06-01 00:00:00'],
            ['ngay_ket_thuc' => '2040-01-01'],
            ['dong_dang_ky_luc' => '2040-01-01 00:00:00'],
            ['ngay_bat_dau' => '2040-02-30'],
            ['mo_dang_ky_luc' => '2040-01-01'],
            ['nam_hoc' => '2040-2042'],
            ['ky_thu' => 4],
        ] as $sai) {
            $this->postJson('/api/semesters', $this->duLieu($sai))
                ->assertUnprocessable()->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
        }
        $this->assertSame(0, HocKy::count());
    }

    public function test_khong_duoc_tao_hoac_put_truc_tiep_trang_thai(): void
    {
        $this->postJson('/api/semesters', $this->duLieu(['trang_thai' => HocKy::ONGOING]))
            ->assertUnprocessable()->assertJsonValidationErrors('trang_thai');
        $ky = $this->taoKy();
        $this->putJson('/api/semesters/'.$ky->id, $this->duLieu(['trang_thai' => HocKy::CLOSED]))
            ->assertUnprocessable()->assertJsonValidationErrors('trang_thai');
        $this->assertSame(HocKy::UPCOMING, $ky->fresh()->trang_thai);
    }

    public function test_chuyen_tien_va_ghi_nhat_ky_moi_lan(): void
    {
        $ky = $this->taoKy();
        foreach ([HocKy::ONGOING, HocKy::CLOSED] as $trangThai) {
            $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => $trangThai])
                ->assertOk()->assertJsonPath('data.trang_thai', $trangThai);
        }
        $this->assertSame(2, NhatKy::where('doi_tuong_loai', 'hoc_ky')->where('hanh_dong', NhatKy::DOI_TRANG_THAI)->count());
        $this->assertDatabaseHas('nhat_ky', ['doi_tuong_id' => $ky->id, 'nguoi_thuc_hien_id' => auth()->id()]);
    }

    public function test_khong_chuyen_lui_bo_buoc_hoac_lap_trang_thai(): void
    {
        $ky = $this->taoKy();
        foreach ([HocKy::UPCOMING, HocKy::CLOSED] as $trangThai) {
            $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => $trangThai])
                ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_TRANSITION_INVALID');
        }
        $ky->update(['trang_thai' => HocKy::CLOSED]);
        $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => HocKy::ONGOING])
            ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_TRANSITION_INVALID');
        $this->assertDatabaseCount('nhat_ky', 0);
    }

    public function test_chi_mot_ky_ongoing(): void
    {
        $this->taoKy(['trang_thai' => HocKy::ONGOING]);
        $ky = $this->taoKy(['ma_hoc_ky' => '2040-2', 'ky_thu' => 2]);
        $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => HocKy::ONGOING])
            ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_TRANSITION_INVALID');
        $this->assertSame(HocKy::UPCOMING, $ky->fresh()->trang_thai);
    }

    public function test_ky_closed_chi_doc_khong_sua_xoa(): void
    {
        $ky = $this->taoKy(['trang_thai' => HocKy::CLOSED]);
        $this->getJson('/api/semesters/'.$ky->id)->assertOk();
        $this->putJson('/api/semesters/'.$ky->id, $this->duLieu())
            ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');
        $this->deleteJson('/api/semesters/'.$ky->id)->assertConflict();
    }

    public function test_xoa_ky_upcoming_va_giu_ma_audit(): void
    {
        $ky = $this->taoKy();
        $this->deleteJson('/api/semesters/'.$ky->id)->assertOk()->assertJsonPath('data', null);
        $this->assertSoftDeleted('hoc_ky', ['id' => $ky->id, 'deleted_by' => auth()->id()]);
        $this->assertDatabaseHas('nhat_ky', ['doi_tuong_loai' => 'hoc_ky', 'hanh_dong' => NhatKy::XOA]);
        $this->getJson('/api/semesters/'.$ky->id)->assertNotFound();
        $this->getJson('/api/semesters')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_khong_xoa_ky_ongoing_hoac_ky_con_lop(): void
    {
        $ky = $this->taoKy(['trang_thai' => HocKy::ONGOING]);
        $this->deleteJson('/api/semesters/'.$ky->id)->assertConflict()->assertJsonPath('ma_loi', 'DELETE_BLOCKED');
        $ky->update(['trang_thai' => HocKy::UPCOMING]);
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $ky->id]);
        $this->deleteJson('/api/semesters/'.$ky->id)
            ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_HAS_SECTIONS');
        $lop->delete();
        $this->deleteJson('/api/semesters/'.$ky->id)->assertOk();
    }

    public function test_sua_ngay_khong_duoc_lam_buoi_hoc_co_san_nam_ngoai_ky(): void
    {
        $ky = $this->taoKy();
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $ky->id]);
        BuoiHoc::factory()->create(['lop_hoc_phan_id' => $lop->id, 'ngay_hoc' => '2040-05-20']);
        $this->putJson('/api/semesters/'.$ky->id, $this->duLieu(['ngay_ket_thuc' => '2040-04-30']))
            ->assertConflict()->assertJsonPath('ma_loi', 'SESSION_OUTSIDE_SEMESTER');
        $this->assertSame('2040-05-31', $ky->fresh()->ngay_ket_thuc->format('Y-m-d'));
    }

    public function test_cap_nhat_bi_chan_chong_lan_voi_ky_khac(): void
    {
        $ky = $this->taoKy();
        $this->taoKy([
            'ma_hoc_ky' => '2040-2', 'ky_thu' => 2,
            'ngay_bat_dau' => '2040-06-01', 'ngay_ket_thuc' => '2040-10-01',
        ]);
        $this->putJson('/api/semesters/'.$ky->id, $this->duLieu(['ngay_ket_thuc' => '2040-06-01']))
            ->assertConflict()->assertJsonPath('ma_loi', 'SEMESTER_OVERLAP');
    }

    public function test_vai_tro_chi_doc_khong_duoc_ghi(): void
    {
        $ky = $this->taoKy();
        foreach ([User::GIANG_VIEN, User::SINH_VIEN] as $vaiTro) {
            $this->actingAs(User::factory()->create(['vai_tro' => $vaiTro]), 'sanctum');
            $this->getJson('/api/semesters')->assertOk();
            $this->getJson('/api/semesters/'.$ky->id)->assertOk();
            $this->postJson('/api/semesters', $this->duLieu())->assertForbidden();
            $this->putJson('/api/semesters/'.$ky->id, $this->duLieu())->assertForbidden();
            $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => HocKy::ONGOING])->assertForbidden();
            $this->deleteJson('/api/semesters/'.$ky->id)->assertForbidden();
        }
    }

    public function test_options_co_nam_hoc_ky_thu_khong_co_ky_da_xoa(): void
    {
        $this->taoKy();
        $this->taoKy(['ma_hoc_ky' => '2040-2', 'ky_thu' => 2])->delete();
        $this->getJson('/api/options/semesters')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nam_hoc', '2040-2041')->assertJsonPath('data.0.ky_thu', 1);
    }

    public function test_yeu_cau_dang_nhap_va_doi_mat_khau_lan_dau(): void
    {
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/semesters')->assertUnauthorized()->assertJsonPath('ma_loi', 'UNAUTHENTICATED');
        $this->actingAs(User::factory()->admin()->create(['must_change_password' => true]), 'sanctum');
        $this->postJson('/api/semesters', $this->duLieu())
            ->assertForbidden()->assertJsonPath('ma_loi', 'MUST_CHANGE_PASSWORD');
    }

    public function test_tu_choi_trang_thai_va_cot_sap_xep_khong_hop_le(): void
    {
        $ky = $this->taoKy();
        $this->patchJson('/api/semesters/'.$ky->id.'/status', ['trang_thai' => 'INVALID'])
            ->assertUnprocessable()->assertJsonValidationErrors('trang_thai');
        $this->getJson('/api/semesters?sort_by=password')->assertUnprocessable();
        $this->assertSame(HocKy::UPCOMING, $ky->fresh()->trang_thai);
    }

    public function test_dang_mo_dang_ky_duoc_tinh_theo_gio_hien_tai(): void
    {
        $ky = $this->taoKy();
        $this->travelTo(now()->setDate(2040, 1, 15)->setTime(10, 0));
        $this->getJson('/api/semesters/'.$ky->id)->assertOk()->assertJsonPath('data.dang_mo_dang_ky', true);
        $ky->update(['trang_thai' => HocKy::CLOSED]);
        $this->getJson('/api/semesters/'.$ky->id)->assertOk()->assertJsonPath('data.dang_mo_dang_ky', false);
    }
}
