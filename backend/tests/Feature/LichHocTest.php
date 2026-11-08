<?php

namespace Tests\Feature;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use App\Services\ScheduleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class LichHocTest extends TestCase
{
    use RefreshDatabase;

    private HocKy $ky;

    private ScheduleService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');
        $this->ky = HocKy::factory()->create();
        $this->service = app(ScheduleService::class);
    }

    private function lop(array $duLieu = []): LopHocPhan
    {
        return LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id, ...$duLieu]);
    }

    private function buoi(LopHocPhan $lop, array $duLieu = []): BuoiHoc
    {
        return BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            ...$duLieu,
        ]);
    }

    private function lichMoi(int $phongId, array $duLieu = []): array
    {
        return [
            'ngay_hoc' => '2026-11-10', 'gio_bat_dau' => '08:00',
            'gio_ket_thuc' => '10:00', 'phong_hoc_id' => $phongId,
            ...$duLieu,
        ];
    }

    private function dangKy(SinhVien $sinhVien, LopHocPhan $lop, string $trangThai = DangKyHocPhan::ACTIVE): void
    {
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id, 'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => $trangThai,
        ]);
    }

    public function test_phat_hien_trung_phong_va_tra_ro_buoi_xung_dot(): void
    {
        $cu = $this->buoi($this->lop());
        $trung = $this->service->timTrungLich($this->lop(), $this->lichMoi($cu->phong_hoc_id));
        $this->assertCount(1, $trung);
        $this->assertSame('phong_hoc', $trung[0]['loai']);
        $this->assertSame($cu->id, $trung[0]['buoi_hoc_id']);
        $this->assertSame('2026-11-10', $trung[0]['ngay_hoc']);
    }

    public function test_phat_hien_trung_giang_vien_ke_ca_khac_phong(): void
    {
        $lop = $this->lop();
        $this->buoi($lop);
        $moi = $this->lop(['giang_vien_id' => $lop->giang_vien_id]);
        $trung = $this->service->timTrungLich($moi, $this->lichMoi(PhongHoc::factory()->create()->id));
        $this->assertSame(['giang_vien'], array_column($trung, 'loai'));
    }

    public function test_phat_hien_trung_sinh_vien_dang_active_trong_hai_lop(): void
    {
        $cu = $this->lop();
        $moi = $this->lop();
        $this->buoi($cu);
        $sv = SinhVien::factory()->create();
        $this->dangKy($sv, $cu);
        $this->dangKy($sv, $moi);
        $trung = $this->service->timTrungLich($moi, $this->lichMoi(PhongHoc::factory()->create()->id));
        $this->assertSame(['sinh_vien'], array_column($trung, 'loai'));
        $this->assertSame($sv->id, $trung[0]['sinh_vien_id']);
        $this->assertSame($sv->ma_sv, $trung[0]['doi_tuong']);
    }

    public function test_khong_tinh_dang_ky_da_huy_khi_kiem_tra_trung_sinh_vien(): void
    {
        $cu = $this->lop();
        $moi = $this->lop();
        $this->buoi($cu);
        $sv = SinhVien::factory()->create();
        $this->dangKy($sv, $cu, DangKyHocPhan::CANCELLED);
        $this->dangKy($sv, $moi);
        $this->assertSame([], $this->service->timTrungLich($moi, $this->lichMoi(PhongHoc::factory()->create()->id)));
    }

    public function test_tra_day_du_nhieu_loai_trung_cung_mot_buoi(): void
    {
        $lop = $this->lop();
        $cu = $this->buoi($lop);
        $moi = $this->lop(['giang_vien_id' => $lop->giang_vien_id]);
        $sv = SinhVien::factory()->create();
        $this->dangKy($sv, $lop);
        $this->dangKy($sv, $moi);
        $trung = $this->service->timTrungLich($moi, $this->lichMoi($cu->phong_hoc_id));
        $this->assertSame(['phong_hoc', 'giang_vien', 'sinh_vien'], array_column($trung, 'loai'));
    }

    public function test_hai_buoi_lien_ke_khong_trung_ca_hai_phia_va_hai_dinh_dang_gio(): void
    {
        $cu = $this->buoi($this->lop());
        $moi = $this->lop();
        foreach ([['05:00', '07:00'], ['09:00', '11:00'], ['09:00:00', '11:00:00']] as [$batDau, $ketThuc]) {
            $this->assertSame([], $this->service->timTrungLich($moi, $this->lichMoi($cu->phong_hoc_id, [
                'gio_bat_dau' => $batDau, 'gio_ket_thuc' => $ketThuc,
            ])));
        }
    }

    public function test_trung_khi_bao_trum_hoac_nam_gon_trong_khoang_cu(): void
    {
        $cu = $this->buoi($this->lop());
        $moi = $this->lop();
        foreach ([['06:00', '10:00'], ['07:30', '08:00'], ['07:00', '09:00']] as [$batDau, $ketThuc]) {
            $this->assertNotEmpty($this->service->timTrungLich($moi, $this->lichMoi($cu->phong_hoc_id, [
                'gio_bat_dau' => $batDau, 'gio_ket_thuc' => $ketThuc,
            ])));
        }
    }

    public function test_cung_phong_cung_gio_khac_ngay_khong_trung(): void
    {
        $cu = $this->buoi($this->lop());
        $this->assertSame([], $this->service->timTrungLich($this->lop(), $this->lichMoi($cu->phong_hoc_id, ['ngay_hoc' => '2026-11-11'])));
    }

    public function test_sua_bo_qua_chinh_buoi_nhung_khong_bo_qua_buoi_cua_lop_khac(): void
    {
        $lop = $this->lop();
        $cu = $this->buoi($lop);
        $duLieu = $this->lichMoi($cu->phong_hoc_id);
        $this->assertSame([], $this->service->timTrungLich($lop, $duLieu, $cu->id));
        $trung = $this->service->timTrungLich($this->lop(), $duLieu, $cu->id);
        $this->assertNotEmpty($trung);
    }

    public function test_bo_qua_buoi_da_huy_done_da_xoa_va_lop_da_xoa(): void
    {
        $lop = $this->lop();
        $phong = PhongHoc::factory()->create();
        $this->buoi($lop, ['phong_hoc_id' => $phong->id, 'trang_thai' => BuoiHoc::CANCELLED]);
        $this->buoi($lop, ['phong_hoc_id' => $phong->id, 'trang_thai' => BuoiHoc::DONE]);
        $this->buoi($lop, ['phong_hoc_id' => $phong->id])->delete();
        $khac = $this->lop();
        $this->buoi($khac, ['phong_hoc_id' => $phong->id]);
        $khac->delete();
        $this->assertSame([], $this->service->timTrungLich($this->lop(), $this->lichMoi($phong->id)));
    }

    public function test_nem_loi_nghiep_vu_409_va_danh_sach_trung_lich(): void
    {
        $cu = $this->buoi($this->lop());
        try {
            $this->service->kiemTraTrungLich($this->lop(), $this->lichMoi($cu->phong_hoc_id));
            $this->fail('Phải phát hiện trùng lịch.');
        } catch (LoiNghiepVu $e) {
            $this->assertSame(409, $e->status);
            $this->assertSame('SCHEDULE_CONFLICT', $e->maLoi);
            $this->assertNotEmpty($e->errors['trung_lich']);
            $this->assertSame(1, BuoiHoc::count());
        }
    }

    public function test_kiem_tra_duoc_lich_giang_vien_moi_truoc_khi_doi_phan_cong(): void
    {
        $lopCu = $this->lop();
        $this->buoi($lopCu);
        $moi = $this->lop();
        $duLieu = $this->lichMoi(PhongHoc::factory()->create()->id);
        $this->assertSame([], $this->service->timTrungLich($moi, $duLieu));
        $trung = $this->service->timTrungLich($moi, $duLieu, giangVienId: $lopCu->giang_vien_id);
        $this->assertSame(['giang_vien'], array_column($trung, 'loai'));
    }

    public function test_kiem_tra_ca_lo_phat_hien_trung_trong_chinh_lo_va_khong_ghi_du_lieu(): void
    {
        $phong = PhongHoc::factory()->create();
        $this->expectException(LoiNghiepVu::class);
        try {
            $this->service->kiemTraDanhSach($this->lop(), [
                $this->lichMoi($phong->id), $this->lichMoi($phong->id),
            ]);
        } finally {
            $this->assertDatabaseCount('buoi_hoc', 0);
        }
    }

    public function test_kiem_tra_ca_lo_cho_phep_cac_buoi_lien_ke(): void
    {
        $phong = PhongHoc::factory()->create();
        $this->service->kiemTraDanhSach($this->lop(), [
            $this->lichMoi($phong->id),
            $this->lichMoi($phong->id, ['gio_bat_dau' => '10:00', 'gio_ket_thuc' => '12:00']),
        ]);
        $this->assertDatabaseCount('buoi_hoc', 0);
    }

    public function test_trung_lich_sinh_vien_khi_dang_ky_lop_moi(): void
    {
        $cu = $this->lop();
        $moi = $this->lop();
        $this->buoi($cu);
        $this->buoi($moi, ['gio_bat_dau' => '08:00', 'gio_ket_thuc' => '10:00']);
        $sv = SinhVien::factory()->create();
        $this->dangKy($sv, $cu);
        $trung = $this->service->timTrungLichDangKy($sv, $moi);
        $this->assertCount(1, $trung);
        $this->assertSame($sv->id, $trung[0]['sinh_vien_id']);
    }

    public function test_kiem_tra_ca_lo_gom_truy_van_khong_lap_theo_so_buoi(): void
    {
        $lop = $this->lop();
        $phong = PhongHoc::factory()->create();
        $cacBuoi = [];
        for ($ngay = 1; $ngay <= 25; $ngay++) {
            $cacBuoi[] = $this->lichMoi($phong->id, ['ngay_hoc' => sprintf('2030-01-%02d', $ngay)]);
        }
        DB::enableQueryLog();
        DB::flushQueryLog();
        $this->service->kiemTraDanhSach($lop, $cacBuoi);
        $this->assertLessThanOrEqual(6, count(DB::getQueryLog()));
        DB::disableQueryLog();
        $this->assertDatabaseCount('buoi_hoc', 0);
    }

    public function test_kiem_tra_ca_lo_khong_nham_phong_cua_buoi_khac_gio(): void
    {
        $cu = $this->buoi($this->lop());
        $phongKhac = PhongHoc::factory()->create();
        $this->service->kiemTraDanhSach($this->lop(), [
            $this->lichMoi($cu->phong_hoc_id, ['gio_bat_dau' => '12:00', 'gio_ket_thuc' => '13:00']),
            $this->lichMoi($phongKhac->id, ['gio_bat_dau' => '07:00', 'gio_ket_thuc' => '08:00']),
        ]);
        $this->assertDatabaseCount('buoi_hoc', 1);
    }

    public function test_kiem_tra_ca_lo_bat_duoc_trung_voi_lich_da_co(): void
    {
        $cu = $this->buoi($this->lop());
        $this->expectException(LoiNghiepVu::class);
        $this->service->kiemTraDanhSach($this->lop(), [
            $this->lichMoi($cu->phong_hoc_id, ['ngay_hoc' => '2026-11-11']),
            $this->lichMoi($cu->phong_hoc_id),
        ]);
    }

    public function test_dang_ky_khong_trung_khi_lop_chua_co_lich_hoac_sinh_vien_da_huy(): void
    {
        $sv = SinhVien::factory()->create();
        $cu = $this->lop();
        $moi = $this->lop();
        $this->assertSame([], $this->service->timTrungLichDangKy($sv, $moi));
        $this->buoi($cu);
        $this->buoi($moi);
        $this->dangKy($sv, $cu, DangKyHocPhan::CANCELLED);
        $this->assertSame([], $this->service->timTrungLichDangKy($sv, $moi));
    }

    public function test_tu_choi_khung_gio_nguoc_thay_vi_so_sanh_sai(): void
    {
        $this->expectException(ValidationException::class);
        $this->service->timTrungLich($this->lop(), $this->lichMoi(1, ['gio_bat_dau' => '12:00', 'gio_ket_thuc' => '10:00']));
    }

    public function test_admin_xem_lich_co_phan_trang_va_dung_resource(): void
    {
        $buoi = $this->buoi($this->lop());
        $this->getJson('/api/schedules')->assertOk()->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $buoi->id)
            ->assertJsonPath('data.0.gio_bat_dau', '07:00')
            ->assertJsonStructure(['data' => [['lop_hoc_phan', 'mon_hoc', 'hoc_ky', 'giang_vien', 'phong_hoc']]]);
    }

    public function test_lich_tong_hop_tra_hinh_thuc_de_to_mau_khoi_lich(): void
    {
        $buoi = $this->buoi($this->lop());
        $buoi->update(['hinh_thuc' => BuoiHoc::HINH_THUC_THUC_HANH]);

        // Màn lịch tuần đọc /api/schedules, không đọc /sections/{id}/sessions.
        // Thiếu trường này thì mọi khối rơi về màu lý thuyết.
        $this->getJson('/api/schedules')
            ->assertOk()
            ->assertJsonPath('data.0.hinh_thuc', 'THUC_HANH');
    }

    public function test_loc_theo_ky_giang_vien_phong_ngay_va_trang_thai(): void
    {
        $lop = $this->lop();
        $buoi = $this->buoi($lop);
        $this->buoi($lop, ['ngay_hoc' => '2026-11-11']);
        $this->buoi($this->lop());
        $this->getJson('/api/schedules?'.http_build_query([
            'hoc_ky_id' => $this->ky->id, 'giang_vien_id' => $lop->giang_vien_id,
            'phong_hoc_id' => $buoi->phong_hoc_id, 'tu_ngay' => '2026-11-10',
            'den_ngay' => '2026-11-10', 'trang_thai' => BuoiHoc::SCHEDULED,
        ]))->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $buoi->id);
    }

    public function test_giang_vien_chi_xem_lich_minh_ke_ca_gui_filter_nguoi_khac(): void
    {
        $lop = $this->lop();
        $buoi = $this->buoi($lop);
        $khac = $this->lop();
        $this->buoi($khac);
        $this->actingAs($lop->giangVien->user, 'sanctum');
        $this->getJson('/api/schedules')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $buoi->id);
        $this->getJson('/api/schedules?giang_vien_id='.$khac->giang_vien_id)->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_sinh_vien_chi_xem_lop_dang_ky_active(): void
    {
        $sv = SinhVien::factory()->create();
        $lop = $this->lop();
        $buoi = $this->buoi($lop);
        $huy = $this->lop();
        $this->buoi($huy);
        $this->buoi($this->lop());
        $this->dangKy($sv, $lop);
        $this->dangKy($sv, $huy, DangKyHocPhan::CANCELLED);
        $this->actingAs($sv->user, 'sanctum')->getJson('/api/schedules')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $buoi->id);
    }

    public function test_tai_khoan_chua_co_ho_so_khong_xem_duoc_lich_nguoi_khac(): void
    {
        $this->buoi($this->lop());
        foreach ([User::GIANG_VIEN, User::SINH_VIEN] as $vaiTro) {
            $this->actingAs(User::factory()->create(['vai_tro' => $vaiTro]), 'sanctum')->getJson('/api/schedules')
                ->assertOk()->assertJsonPath('meta.total', 0);
        }
    }

    public function test_khong_tra_buoi_hoac_lop_da_xoa_nhung_giu_ten_giang_vien_cu(): void
    {
        $lop = $this->lop();
        $this->buoi($lop)->delete();
        $buoi = $this->buoi($lop);
        $lop->giangVien->delete();
        $lopKhac = $this->lop();
        $this->buoi($lopKhac);
        $lopKhac->delete();
        $this->getJson('/api/schedules')->assertOk()->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $buoi->id)->assertJsonPath('data.0.giang_vien.da_xoa', true);
    }

    public function test_filter_ngay_mot_phia_va_ket_qua_rong_van_200(): void
    {
        $this->buoi($this->lop());
        $this->getJson('/api/schedules?den_ngay=2026-11-10')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/schedules?tu_ngay=2030-01-01')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_kiem_tra_query_va_yeu_cau_xac_thuc(): void
    {
        $this->getJson('/api/schedules?tu_ngay=2026-11-10&den_ngay=2026-11-01')->assertUnprocessable();
        $this->getJson('/api/schedules?sort_by=password')->assertUnprocessable();
        $this->getJson('/api/schedules?per_page=1000')->assertUnprocessable();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/schedules')->assertUnauthorized();
        $this->actingAs(User::factory()->admin()->create(['must_change_password' => true]), 'sanctum');
        $this->getJson('/api/schedules')->assertForbidden()->assertJsonPath('ma_loi', 'MUST_CHANGE_PASSWORD');
    }

    public function test_sap_xep_on_dinh_va_khong_n_cong_mot_truy_van(): void
    {
        $lop = $this->lop();
        $buoi = $this->buoi($lop, ['ngay_hoc' => '2026-11-11']);
        for ($i = 0; $i < 12; $i++) {
            $this->buoi($lop);
        }
        DB::enableQueryLog();
        DB::flushQueryLog();
        $this->getJson('/api/schedules?per_page=25&sort_by=ngay_hoc&sort_dir=desc')
            ->assertOk()->assertJsonPath('meta.total', 13)->assertJsonPath('data.0.id', $buoi->id);
        $this->assertLessThanOrEqual(10, count(DB::getQueryLog()));
        DB::disableQueryLog();
    }
}
