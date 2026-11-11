<?php

namespace Tests\Feature;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\DiemDanh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\SinhVien;
use App\Models\User;
use App\Services\DashboardService;
use Database\Seeders\CauHinhSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Dashboard GIANG_VIEN (SCR-04) và SINH_VIEN (SCR-05).
 * Kịch bản: docs/06-test-plan.md TC-16a/b/c; hợp đồng: docs/04-api-contract.md §14.
 */
class DashboardVaiTroTest extends TestCase
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

    private function lopCuaGiangVien(GiangVien $giangVien, ?HocKy $hocKy = null): LopHocPhan
    {
        return LopHocPhan::factory()->create([
            'mon_hoc_id' => MonHoc::factory()->create()->id,
            'hoc_ky_id' => ($hocKy ?? $this->hocKy)->id,
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
    // TC-16a — phân quyền, nhánh rỗng, dữ liệu hỏng
    // =================================================================

    public function test_giang_vien_goi_dashboard_teacher_thanh_cong(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $this->lopCuaGiangVien($giangVien);

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.hoc_ky.id', $this->hocKy->id)
            ->assertJsonStructure([
                'data' => [
                    'hoc_ky' => ['id', 'ma_hoc_ky', 'ten_hoc_ky', 'trang_thai'],
                    'the_so_lieu' => ['*' => ['khoa', 'label', 'gia_tri', 'don_vi', 'phu_chu', 'xu_huong']],
                    'lop_phu_trach',
                    'buoi_sap_toi',
                    'buoi_chua_diem_danh',
                    'viec_can_lam',
                ],
            ]);
    }

    public function test_admin_va_sinh_vien_khong_goi_duoc_dashboard_teacher(): void
    {
        [$svUser] = $this->sinhVienCoTaiKhoan();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    public function test_sinh_vien_goi_dashboard_student_thanh_cong(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $this->dangKy($sinhVien, $this->lopCuaGiangVien($giangVien));

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.hoc_ky.id', $this->hocKy->id)
            ->assertJsonStructure([
                'data' => [
                    'hoc_ky',
                    'the_so_lieu',
                    'hoc_phan_da_dang_ky',
                    'thoi_khoa_bieu_tuan' => ['tu_ngay', 'den_ngay', 'cac_buoi'],
                    'gpa' => ['hoc_ky_hien_tai', 'tich_luy'],
                    'chuyen_can',
                ],
            ]);
    }

    public function test_admin_va_giang_vien_khong_goi_duoc_dashboard_student(): void
    {
        [$gvUser] = $this->giangVienCoTaiKhoan();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    public function test_giang_vien_chua_phan_lop_nhan_200_voi_mang_rong(): void
    {
        [$gvUser] = $this->giangVienCoTaiKhoan();

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk()
            ->assertJsonPath('data.hoc_ky', null);

        $this->assertSame([], $response->json('data.the_so_lieu'));
        $this->assertSame([], $response->json('data.lop_phu_trach'));
        $this->assertSame([], $response->json('data.buoi_sap_toi'));
        $this->assertSame([], $response->json('data.buoi_chua_diem_danh'));
        $this->assertSame([], $response->json('data.viec_can_lam'));
    }

    public function test_sinh_vien_chua_dang_ky_nhan_200_va_chuyen_can_null(): void
    {
        [$svUser] = $this->sinhVienCoTaiKhoan();

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk()
            ->assertJsonPath('data.hoc_ky', null);

        $this->assertSame([], $response->json('data.the_so_lieu'));
        $this->assertSame([], $response->json('data.hoc_phan_da_dang_ky'));
        $this->assertNull($response->json('data.chuyen_can.ty_le'));
        $this->assertSame(0, $response->json('data.chuyen_can.mau_so'));
    }

    public function test_tai_khoan_thieu_ho_so_nhan_403_chu_khong_500(): void
    {
        $gvUser = User::factory()->giangVien()->create(['must_change_password' => false]);
        $svUser = User::factory()->sinhVien()->create(['must_change_password' => false]);

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN')
            ->assertJsonPath('message', 'Không tìm thấy hồ sơ giảng viên.');

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN')
            ->assertJsonPath('message', 'Không tìm thấy hồ sơ sinh viên.');
    }

    // =================================================================
    // §14a — chọn học kỳ
    // =================================================================

    public function test_khong_truyen_hoc_ky_id_thi_chon_ky_ongoing_co_du_lieu(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();

        $kyCu = HocKy::factory()->create([
            'trang_thai' => HocKy::CLOSED,
            'ngay_bat_dau' => now()->subYear()->toDateString(),
            'ngay_ket_thuc' => now()->subMonths(8)->toDateString(),
        ]);
        $this->lopCuaGiangVien($giangVien, $kyCu);
        $this->lopCuaGiangVien($giangVien, $this->hocKy);

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk()
            ->assertJsonPath('data.hoc_ky.id', $this->hocKy->id)
            ->assertJsonPath('data.hoc_ky.trang_thai', HocKy::ONGOING);
    }

    public function test_khong_co_ky_ongoing_thi_lay_ky_moi_nhat_co_du_lieu(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();

        $this->hocKy->update(['trang_thai' => HocKy::CLOSED]);

        // Ghim ngày của kỳ setUp: factory sinh `ngay_bat_dau` trong 2025-01..2027-08
        // theo `unique()` cấp phát. Không ghim thì nó có thể MỚI HƠN $kyMoi và
        // thành "kỳ mới nhất" — test đỏ ngẫu nhiên tuỳ thứ tự cấp phát.
        $this->hocKy->update(['ngay_bat_dau' => now()->subYears(3)->toDateString()]);

        $kyMoi = HocKy::factory()->create([
            'trang_thai' => HocKy::CLOSED,
            'ngay_bat_dau' => now()->subMonths(4)->toDateString(),
            'ngay_ket_thuc' => now()->subMonth()->toDateString(),
        ]);
        $kyCu = HocKy::factory()->create([
            'trang_thai' => HocKy::CLOSED,
            'ngay_bat_dau' => now()->subYears(2)->toDateString(),
            'ngay_ket_thuc' => now()->subYears(2)->addMonths(4)->toDateString(),
        ]);

        $this->lopCuaGiangVien($giangVien, $kyCu);
        $this->lopCuaGiangVien($giangVien, $kyMoi);
        // Lớp của kỳ ongoing đã đóng vẫn tính là "có dữ liệu" của giảng viên
        $this->lopCuaGiangVien($giangVien, $this->hocKy)->update(['trang_thai' => LopHocPhan::CLOSED]);

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk()
            ->assertJsonPath('data.hoc_ky.id', $kyMoi->id);
    }

    public function test_truyen_hoc_ky_id_hop_le_thi_tra_dung_ky_do(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();

        $kyKhac = HocKy::factory()->create([
            'trang_thai' => HocKy::CLOSED,
            'ngay_bat_dau' => now()->subYear()->toDateString(),
        ]);
        $this->lopCuaGiangVien($giangVien, $kyKhac);
        $this->lopCuaGiangVien($giangVien, $this->hocKy);

        $this->actingAs($gvUser, 'sanctum')
            ->getJson("/api/dashboard/teacher?hoc_ky_id={$kyKhac->id}")
            ->assertOk()
            ->assertJsonPath('data.hoc_ky.id', $kyKhac->id)
            ->assertJsonPath('data.hoc_ky.trang_thai', HocKy::CLOSED);
    }

    public function test_hoc_ky_id_khong_ton_tai_tra_404(): void
    {
        [$gvUser] = $this->giangVienCoTaiKhoan();
        [$svUser] = $this->sinhVienCoTaiKhoan();

        $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher?hoc_ky_id=999999')
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'SEMESTER_NOT_FOUND');

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student?hoc_ky_id=999999')
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'SEMESTER_NOT_FOUND');
    }

    public function test_ky_ton_tai_nhung_khong_co_du_lieu_tra_200_va_rong(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $this->lopCuaGiangVien($giangVien);

        $kyTrong = HocKy::factory()->create(['trang_thai' => HocKy::CLOSED]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson("/api/dashboard/teacher?hoc_ky_id={$kyTrong->id}")
            ->assertOk()
            ->assertJsonPath('data.hoc_ky.id', $kyTrong->id);

        $this->assertSame([], $response->json('data.lop_phu_trach'));
        $this->assertSame([], $response->json('data.buoi_sap_toi'));
    }

    // =================================================================
    // TC-16b — TEACHER
    // =================================================================

    public function test_chi_thay_lop_cua_minh(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        [, $giangVienKhac] = $this->giangVienCoTaiKhoan();

        $lopMinh = $this->lopCuaGiangVien($giangVien);
        $lopNguoiKhac = $this->lopCuaGiangVien($giangVienKhac);

        $sinhVien = SinhVien::factory()->create();
        $this->dangKy($sinhVien, $lopMinh);
        $this->dangKy($sinhVien, $lopNguoiKhac);

        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopNguoiKhac->id,
            'ngay_hoc' => now()->addDays(2)->toDateString(),
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $idsLop = array_column($response->json('data.lop_phu_trach'), 'id');
        $this->assertSame([$lopMinh->id], $idsLop);

        $maLopSapToi = array_column($response->json('data.buoi_sap_toi'), 'ma_lop_hp');
        $this->assertNotContains($lopNguoiKhac->ma_lop_hp, $maLopSapToi);
    }

    public function test_buoi_sap_toi_trong_cua_so_14_ngay_va_chi_buoi_scheduled(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        $dungHan = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->addDays(14)->toDateString(),
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->addDays(15)->toDateString(),
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->addDays(3)->toDateString(),
            'trang_thai' => BuoiHoc::CANCELLED,
        ]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->addDays(4)->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $ids = array_column($response->json('data.buoi_sap_toi'), 'id');
        $this->assertContains($dungHan->id, $ids, 'Buổi đúng today+14 phải có mặt.');
        $this->assertCount(1, $ids);
        $this->assertSame(1, $response->json('data.the_so_lieu.2.gia_tri'));
    }

    public function test_buoi_chua_diem_danh_bo_qua_buoi_da_co_diem_danh_va_buoi_tuong_lai(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        $daQuaCoDiemDanh = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(5)->toDateString(),
            'gio_ket_thuc' => '08:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        $daQuaChuaDiemDanh = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(3)->toDateString(),
            'gio_ket_thuc' => '08:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        $tuongLai = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->addDays(3)->toDateString(),
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $sinhVien = SinhVien::factory()->create();
        $dangKy = $this->dangKy($sinhVien, $lop);
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $daQuaCoDiemDanh->id,
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'trang_thai' => DiemDanh::PRESENT,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $ids = array_column($response->json('data.buoi_chua_diem_danh'), 'id');
        $this->assertContains($daQuaChuaDiemDanh->id, $ids);
        $this->assertNotContains($daQuaCoDiemDanh->id, $ids);
        $this->assertNotContains($tuongLai->id, $ids);
        $this->assertSame(1, $response->json('data.buoi_chua_diem_danh.0.si_so_lop'));
    }

    public function test_con_sua_duoc_theo_han_va_trang_thai_ky(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        // 2 ngày trước: trong hạn 7 ngày → còn sửa được
        $trongHan = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(2)->toDateString(),
            'gio_ket_thuc' => '08:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        // 20 ngày trước: đã quá hạn 7 ngày
        $quaHan = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(20)->toDateString(),
            'gio_ket_thuc' => '08:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $theoId = collect($response->json('data.buoi_chua_diem_danh'))->keyBy('id');
        $this->assertTrue($theoId[$trongHan->id]['con_sua_duoc']);
        $this->assertFalse($theoId[$quaHan->id]['con_sua_duoc']);
        $this->assertGreaterThanOrEqual(19, $theoId[$quaHan->id]['so_ngay_tre']);
        // Sắp theo `ngay_hoc` TĂNG dần (docs/04 §14): buổi cũ nhất đứng đầu,
        // tức là $quaHan (20 ngày trước), không phải $trongHan.
        $this->assertSame($quaHan->id, $response->json('data.buoi_chua_diem_danh.0.id'));

        // Kỳ CLOSED → mọi buổi đều không sửa được
        $this->hocKy->update(['trang_thai' => HocKy::CLOSED]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $tatCaKhongSuaDuoc = collect($response->json('data.buoi_chua_diem_danh'))
            ->every(fn (array $buoi) => $buoi['con_sua_duoc'] === false);
        $this->assertTrue($tatCaKhongSuaDuoc);
    }

    public function test_viec_can_lam_chi_giu_muc_co_so_luong_va_sap_theo_muc_do(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        // Buổi đã qua chưa điểm danh, đã quá hạn → muc_do = cao
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(30)->toDateString(),
            'gio_ket_thuc' => '08:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        // Lớp đã có buổi DONE và chưa chốt điểm → chot_diem = trung_binh
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(40)->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $viec = $response->json('data.viec_can_lam');
        $loai = array_column($viec, 'loai');

        $this->assertSame(['cham_diem_danh', 'chot_diem'], $loai);
        $this->assertSame('cao', $viec[0]['muc_do']);
        $this->assertSame('trung_binh', $viec[1]['muc_do']);
        $this->assertSame('/diem-danh', $viec[0]['url']);

        foreach ($viec as $muc) {
            $this->assertGreaterThan(0, $muc['so_luong']);
        }
    }

    public function test_viec_can_lam_chot_diem_bi_bo_khi_ky_khong_ongoing(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(10)->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);

        $this->hocKy->update(['trang_thai' => HocKy::CLOSED]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $loai = array_column($response->json('data.viec_can_lam'), 'loai');
        $this->assertNotContains('chot_diem', $loai);
    }

    // =================================================================
    // §14 — `lop_phu_trach[].diem_tb_lop` (biểu đồ "Điểm TB lớp phụ trách")
    // =================================================================

    /** Gắn điểm tổng kết cho một đăng ký mới của sinh viên trong lớp. */
    private function chamDiem(LopHocPhan $lop, float $diemTongKet, string $trangThaiDangKy = DangKyHocPhan::ACTIVE): void
    {
        $dangKy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => SinhVien::factory()->create()->id,
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => $trangThaiDangKy,
            'dang_ky_luc' => now()->subMonth(),
        ]);

        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_tong_ket' => $diemTongKet,
        ]);
    }

    public function test_diem_tb_lop_la_trung_binh_dang_ky_active_lam_tron_2_chu_so(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        // 6.0, 8.0, 9.5 → 7.8333… → 7.83
        foreach ([6.0, 8.0, 9.5] as $diem) {
            $this->chamDiem($lop, $diem);
        }

        // Đăng ký đã huỷ KHÔNG được kéo trung bình (chỉ tính `ACTIVE`).
        $this->chamDiem($lop, 0.5, DangKyHocPhan::CANCELLED);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $lopTra = collect($response->json('data.lop_phu_trach'))->firstWhere('id', $lop->id);
        $this->assertNotNull($lopTra);
        $this->assertArrayHasKey('diem_tb_lop', $lopTra);
        $this->assertEqualsWithDelta(7.83, $lopTra['diem_tb_lop'], 0.0001);
    }

    public function test_dashboard_teacher_diem_tb_lop_null_khi_chua_ai_duoc_cham(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);

        // Có đăng ký ACTIVE nhưng chưa có bản ghi `diem` → null, không phải 0.
        $this->dangKy(SinhVien::factory()->create(), $lop);

        // Bản ghi `diem` tồn tại nhưng `diem_tong_ket` còn trống cũng không tính.
        $dangKyChuaCham = $this->dangKy(SinhVien::factory()->create(), $lop);
        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKyChuaCham->id,
            'diem_tong_ket' => null,
        ]);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $lopTra = collect($response->json('data.lop_phu_trach'))->firstWhere('id', $lop->id);
        $this->assertArrayHasKey('diem_tb_lop', $lopTra);
        $this->assertNull($lopTra['diem_tb_lop']);
    }

    public function test_diem_tb_lop_moi_lop_mot_gia_tri_khong_lan_sang_lop_khac(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $lopCoDiem = $this->lopCuaGiangVien($giangVien);
        $lopChuaCham = $this->lopCuaGiangVien($giangVien);

        $this->chamDiem($lopCoDiem, 9.0);
        $this->chamDiem($lopCoDiem, 7.0);
        $this->dangKy(SinhVien::factory()->create(), $lopChuaCham);

        $response = $this->actingAs($gvUser, 'sanctum')
            ->getJson('/api/dashboard/teacher')
            ->assertOk();

        $theoId = collect($response->json('data.lop_phu_trach'))->keyBy('id');
        $this->assertEqualsWithDelta(8.0, $theoId[$lopCoDiem->id]['diem_tb_lop'], 0.0001);
        $this->assertNull($theoId[$lopChuaCham->id]['diem_tb_lop']);
    }

    /**
     * Chống N+1: số truy vấn phải KHÔNG đổi khi số lớp tăng 10 lần.
     * Nếu ai đó đổi `diemTrungBinhLop()` thành lời gọi trong vòng lặp, test này đỏ.
     */
    public function test_diem_tb_lop_khong_phat_sinh_them_truy_van_theo_so_lop(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();

        // Gọi một lần trước khi đo: `actingAs()` giữ nguyên instance User, nên
        // quan hệ `giangVien` được nạp ở request đầu và các request sau bỏ qua
        // truy vấn hồ sơ. Không sưởi ấm thì lần đo đầu luôn nhiều hơn 1 truy vấn
        // — chênh lệch do test, không phải do code.
        $this->actingAs($gvUser, 'sanctum')->getJson('/api/dashboard/teacher')->assertOk();

        $demTruyVan = function () use ($gvUser): int {
            DB::enableQueryLog();
            DB::flushQueryLog();

            $this->actingAs($gvUser, 'sanctum')->getJson('/api/dashboard/teacher')->assertOk();

            $so = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $so;
        };

        // Mỗi lớp có một buổi đã qua chưa điểm danh, để hai lần đo có CÙNG hình
        // dạng truy vấn (truy vấn cấu hình số ngày sửa chỉ chạy khi có buổi đó).
        $themLopCoDiem = function (float $diem) use ($giangVien): void {
            $lop = $this->lopCuaGiangVien($giangVien);
            $this->chamDiem($lop, $diem);
            BuoiHoc::factory()->create([
                'lop_hoc_phan_id' => $lop->id,
                'ngay_hoc' => now()->subDays(3)->toDateString(),
                'gio_ket_thuc' => '08:00',
                'trang_thai' => BuoiHoc::SCHEDULED,
            ]);
        };

        $themLopCoDiem(8.0);
        $soTruyVanMotLop = $demTruyVan();

        for ($i = 0; $i < 9; $i++) {
            $themLopCoDiem(5.0 + $i / 10);
        }

        $soTruyVanMuoiLop = $demTruyVan();

        $this->assertSame(
            $soTruyVanMotLop,
            $soTruyVanMuoiLop,
            "Số truy vấn tăng từ {$soTruyVanMotLop} lên {$soTruyVanMuoiLop} khi số lớp tăng — có N+1.",
        );
    }

    // =================================================================
    // TC-16c — STUDENT
    // =================================================================

    private function taoLopVoiDiemDanh(SinhVien $sinhVien, GiangVien $giangVien, array $trangThais): array
    {
        $lop = $this->lopCuaGiangVien($giangVien);
        $dangKy = $this->dangKy($sinhVien, $lop);

        $soNgay = count($trangThais);
        $ketQua = [];
        foreach ($trangThais as $i => $trangThai) {
            $buoi = BuoiHoc::factory()->create([
                'lop_hoc_phan_id' => $lop->id,
                'ngay_hoc' => now()->subDays($soNgay - $i)->toDateString(),
                'trang_thai' => BuoiHoc::DONE,
            ]);
            DiemDanh::factory()->create([
                'buoi_hoc_id' => $buoi->id,
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'trang_thai' => $trangThai,
            ]);
            $ketQua[] = $buoi;
        }

        return [$lop, $dangKy, $ketQua];
    }

    public function test_cong_thuc_chuyen_can_tru_co_phep(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        // 3 PRESENT + 1 LATE + 1 ABSENT + 2 EXCUSED = tổng 7; mau_so = 5
        $this->taoLopVoiDiemDanh($sinhVien, $giangVien, [
            DiemDanh::PRESENT,
            DiemDanh::PRESENT,
            DiemDanh::PRESENT,
            DiemDanh::LATE,
            DiemDanh::ABSENT,
            DiemDanh::EXCUSED,
            DiemDanh::EXCUSED,
        ]);

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $chuyenCan = $response->json('data.chuyen_can');
        $this->assertSame(7, $chuyenCan['tong_buoi_da_diem_danh']);
        $this->assertSame(2, $chuyenCan['co_phep']);
        $this->assertSame(5, $chuyenCan['mau_so']);
        // (3 + 1) / 5 = 0.8
        $this->assertSame(0.8, $chuyenCan['ty_le']);
        $this->assertSame(80, $response->json('data.the_so_lieu.3.gia_tri'));
    }

    public function test_br27_buoi_truoc_ngay_dang_ky_khong_vao_mau_so(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        $lop = $this->lopCuaGiangVien($giangVien);
        $dangKy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDays(3)->startOfDay(),
        ]);

        // Buổi trước mốc đăng ký, có bản ghi điểm danh ABSENT cũ — KHÔNG được tính
        $buoiCu = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(10)->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoiCu->id,
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'trang_thai' => DiemDanh::ABSENT,
        ]);

        // Buổi sau mốc đăng ký, PRESENT — được tính
        $buoiMoi = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDay()->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoiMoi->id,
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'trang_thai' => DiemDanh::PRESENT,
        ]);

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $chuyenCan = $response->json('data.chuyen_can');
        $this->assertSame(1, $chuyenCan['tong_buoi_da_diem_danh']);
        $this->assertSame(1, $chuyenCan['mau_so']);
        $this->assertSame(0, $chuyenCan['vang']);
        // `ty_le` là PHÂN SỐ 0–1 (docs/04 §14), không phải phần trăm. JSON
        // không có `JSON_PRESERVE_ZERO_FRACTION` nên `1.0` serialize thành `1`;
        // dùng assertEquals để không phụ thuộc int/float của decoder.
        $this->assertEquals(1.0, $chuyenCan['ty_le']);
    }

    public function test_ty_le_tung_mon_cong_lai_khop_khoi_chuyen_can(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        $this->taoLopVoiDiemDanh($sinhVien, $giangVien, [
            DiemDanh::PRESENT,
            DiemDanh::PRESENT,
            DiemDanh::ABSENT,
        ]);
        $this->taoLopVoiDiemDanh($sinhVien, $giangVien, [
            DiemDanh::LATE,
            DiemDanh::EXCUSED,
        ]);

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $hocPhans = $response->json('data.hoc_phan_da_dang_ky');
        $this->assertCount(2, $hocPhans);

        $tongCoMat = 0;
        $tongMauSo = 0;
        foreach ($hocPhans as $hocPhan) {
            $tyLe = $hocPhan['ty_le_chuyen_can'];
            $this->assertNotNull($tyLe);
            $tongCoMat += (int) round($tyLe * 3); // chỉ kiểm tra dạng số, xem assert dưới
            $tongMauSo++;
        }
        $this->assertSame(2, $tongMauSo);

        // Môn 1: 2/3 = 0.6667, môn 2: 1/1 = 1.0 → tổng (2 + 1) / (3 + 1) = 0.75
        $this->assertSame(0.75, $response->json('data.chuyen_can.ty_le'));
        $this->assertSame(4, $response->json('data.chuyen_can.mau_so'));
        $this->assertSame(1, $response->json('data.chuyen_can.co_phep'));
    }

    public function test_ty_le_thap_nhat_lay_mon_nho_nhat(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        $monTot = MonHoc::factory()->create(['ma_mon' => 'INT9999', 'ten_mon' => 'Môn tốt']);
        $lopTot = LopHocPhan::factory()->create([
            'mon_hoc_id' => $monTot->id,
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dkTot = $this->dangKy($sinhVien, $lopTot);
        $buoiTot = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopTot->id,
            'ngay_hoc' => now()->subDays(2)->toDateString(),
            'trang_thai' => BuoiHoc::DONE,
        ]);
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoiTot->id,
            'dang_ky_hoc_phan_id' => $dkTot->id,
            'trang_thai' => DiemDanh::PRESENT,
        ]);

        $monXau = MonHoc::factory()->create(['ma_mon' => 'INT8888', 'ten_mon' => 'Môn cần chú ý']);
        $lopXau = LopHocPhan::factory()->create([
            'mon_hoc_id' => $monXau->id,
            'hoc_ky_id' => $this->hocKy->id,
            'giang_vien_id' => $giangVien->id,
        ]);
        $dkXau = $this->dangKy($sinhVien, $lopXau);
        foreach ([DiemDanh::PRESENT, DiemDanh::ABSENT, DiemDanh::ABSENT] as $i => $trangThai) {
            $buoi = BuoiHoc::factory()->create([
                'lop_hoc_phan_id' => $lopXau->id,
                'ngay_hoc' => now()->subDays(10 - $i)->toDateString(),
                'trang_thai' => BuoiHoc::DONE,
            ]);
            DiemDanh::factory()->create([
                'buoi_hoc_id' => $buoi->id,
                'dang_ky_hoc_phan_id' => $dkXau->id,
                'trang_thai' => $trangThai,
            ]);
        }

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $thapNhat = $response->json('data.chuyen_can.ty_le_thap_nhat');
        $this->assertSame('INT8888', $thapNhat['ma_mon']);
        $this->assertSame('Môn cần chú ý', $thapNhat['ten_mon']);
        $this->assertEqualsWithDelta(0.3333, $thapNhat['ty_le'], 0.0001);
    }

    public function test_tuan_hien_tai_tu_thu_2_den_chu_nhat_va_thu_cua_chu_nhat_la_8(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        $lop = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lop);

        $chuNhat = now()->startOfWeek()->addDays(6);
        $buoiChuNhat = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => $chuNhat->toDateString(),
            'trang_thai' => BuoiHoc::CANCELLED,
            'ly_do_huy' => 'Giảng viên ốm',
        ]);

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $tuan = $response->json('data.thoi_khoa_bieu_tuan');
        $this->assertSame(now()->startOfWeek()->toDateString(), $tuan['tu_ngay']);
        $this->assertSame($chuNhat->toDateString(), $tuan['den_ngay']);

        $buoi = collect($tuan['cac_buoi'])->firstWhere('id', $buoiChuNhat->id);
        $this->assertNotNull($buoi);
        $this->assertSame(8, $buoi['thu']);
        $this->assertSame(BuoiHoc::CANCELLED, $buoi['trang_thai']);
        $this->assertSame('Giảng viên ốm', $buoi['ly_do_huy']);
    }

    public function test_khong_thay_buoi_cua_lop_khong_dang_ky_active(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        $lopActive = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lopActive);

        $lopDaHuy = $this->lopCuaGiangVien($giangVien);
        $dangKyHuy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopDaHuy->id,
            'trang_thai' => DangKyHocPhan::CANCELLED,
            'dang_ky_luc' => now()->subMonth(),
        ]);
        $this->assertNotNull($dangKyHuy);

        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopDaHuy->id,
            'ngay_hoc' => now()->startOfWeek()->toDateString(),
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk();

        $this->assertSame([], $response->json('data.thoi_khoa_bieu_tuan.cac_buoi'));
        $this->assertSame(1, count($response->json('data.hoc_phan_da_dang_ky')));
    }

    public function test_gpa_cua_dashboard_bang_dung_payload_me_gpa(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);
        $dangKy = $this->dangKy($sinhVien, $lop);
        Diem::factory()->create([
            'dang_ky_hoc_phan_id' => $dangKy->id,
            'diem_tong_ket' => 8.0,
            'diem_he_4' => 3.5,
            'ket_qua' => Diem::DAT,
        ]);

        $gpaRieng = $this->actingAs($svUser, 'sanctum')->getJson('/api/me/gpa')->json('data');
        $gpaDashboard = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/dashboard/student')
            ->assertOk()
            ->json('data.gpa');

        $this->assertEquals($gpaRieng, $gpaDashboard);
    }

    public function test_chi_so_diem_tb_lop_la_trung_binh_mot_con_so(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lop);

        foreach ([6.0, 8.0, 9.5] as $diem) {
            $banKhac = SinhVien::factory()->create();
            $dk = $this->dangKy($banKhac, $lop);
            Diem::factory()->create([
                'dang_ky_hoc_phan_id' => $dk->id,
                'diem_tong_ket' => $diem,
            ]);
        }

        $response = $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/me/grades')
            ->assertOk();

        $monHoc = $response->json('data.mon_hoc');
        $this->assertCount(1, $monHoc);
        // (6.0 + 8.0 + 9.5) / 3 = 7.8333… → 7.83
        $this->assertSame(7.83, $monHoc[0]['diem_tb_lop']);

        // Không lộ điểm từng sinh viên khác — chỉ một khoá vô hướng
        $this->assertIsFloat($response->json('data.mon_hoc.0.diem_tb_lop'));
        $this->assertArrayNotHasKey('diem_sinh_vien', $monHoc[0]);
    }

    public function test_diem_tb_lop_null_khi_chua_ai_duoc_cham(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();
        $lop = $this->lopCuaGiangVien($giangVien);
        $this->dangKy($sinhVien, $lop);

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/me/grades')
            ->assertOk()
            ->assertJsonPath('data.mon_hoc.0.diem_tb_lop', null);
    }

    // =================================================================
    // Ngân sách truy vấn (TC-16b.10, TC-16c.9)
    // =================================================================

    public function test_dashboard_teacher_toi_da_8_truy_van(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();

        for ($i = 0; $i < 3; $i++) {
            $lop = $this->lopCuaGiangVien($giangVien);
            for ($j = 0; $j < 5; $j++) {
                $this->dangKy(SinhVien::factory()->create(), $lop);
            }
            BuoiHoc::factory()->count(3)->create([
                'lop_hoc_phan_id' => $lop->id,
                'ngay_hoc' => now()->addDays($i + 1)->toDateString(),
                'trang_thai' => BuoiHoc::SCHEDULED,
            ]);
            BuoiHoc::factory()->create([
                'lop_hoc_phan_id' => $lop->id,
                'ngay_hoc' => now()->subDays(3)->toDateString(),
                'gio_ket_thuc' => '08:00',
                'trang_thai' => BuoiHoc::SCHEDULED,
            ]);
        }

        DB::enableQueryLog();
        DB::flushQueryLog();

        $this->actingAs($gvUser, 'sanctum')->getJson('/api/dashboard/teacher')->assertOk();

        $soTruyVan = count(DB::getQueryLog());
        DB::disableQueryLog();

        Log::info("Dashboard teacher: {$soTruyVan} truy vấn.");
        // Ngưỡng 9 = 8 của bản trước + 1 truy vấn gộp AVG cho `diem_tb_lop` (§14).
        // Truy vấn đó KHÔNG nằm trong vòng lặp — số truy vấn không đổi khi số lớp
        // tăng, khoá riêng bằng `test_diem_tb_lop_khong_phat_sinh_them_truy_van_theo_so_lop`.
        $this->assertLessThanOrEqual(9, $soTruyVan, "Dashboard teacher dùng {$soTruyVan} truy vấn, vượt ngân sách 9.");
    }

    public function test_dashboard_student_toi_da_8_truy_van(): void
    {
        [$svUser, $sinhVien] = $this->sinhVienCoTaiKhoan();
        [, $giangVien] = $this->giangVienCoTaiKhoan();

        for ($i = 0; $i < 5; $i++) {
            $lop = $this->lopCuaGiangVien($giangVien);
            $dangKy = $this->dangKy($sinhVien, $lop);
            foreach ([0, 1, 2] as $j) {
                $buoi = BuoiHoc::factory()->create([
                    'lop_hoc_phan_id' => $lop->id,
                    'ngay_hoc' => now()->startOfWeek()->addDays($j)->toDateString(),
                    'trang_thai' => BuoiHoc::DONE,
                ]);
                DiemDanh::factory()->create([
                    'buoi_hoc_id' => $buoi->id,
                    'dang_ky_hoc_phan_id' => $dangKy->id,
                    'trang_thai' => DiemDanh::PRESENT,
                ]);
            }
            Diem::factory()->create([
                'dang_ky_hoc_phan_id' => $dangKy->id,
                'diem_tong_ket' => 8.0,
                'diem_he_4' => 3.5,
            ]);
        }

        DB::enableQueryLog();
        DB::flushQueryLog();

        $this->actingAs($svUser, 'sanctum')->getJson('/api/dashboard/student')->assertOk();

        $nhatKy = DB::getQueryLog();
        $soTruyVan = count($nhatKy);
        DB::disableQueryLog();

        Log::info("Dashboard student: {$soTruyVan} truy vấn.");
        // Ngưỡng 10, không phải 8: đặc tả cũ đếm một chuỗi eager-load là MỘT truy
        // vấn, trong khi Eloquent chạy mỗi quan hệ một truy vấn riêng. Bảng chi
        // tiết 10 truy vấn nằm ở docs/04 §14a. Điều cốt lõi vẫn được khoá: không
        // có truy vấn nào nằm trong vòng lặp (N+1).
        $this->assertLessThanOrEqual(10, $soTruyVan, "Dashboard student dùng {$soTruyVan} truy vấn, vượt ngân sách 10.");
    }

    public function test_service_nem_loi_nghiep_vu_khi_hoc_ky_khong_ton_tai(): void
    {
        [$gvUser, $giangVien] = $this->giangVienCoTaiKhoan();
        $this->lopCuaGiangVien($giangVien);

        $this->expectException(LoiNghiepVu::class);
        $this->expectExceptionMessage('Không tìm thấy học kỳ yêu cầu.');

        app(DashboardService::class)->layThongKeGiangVien($gvUser, 999999);
    }
}
