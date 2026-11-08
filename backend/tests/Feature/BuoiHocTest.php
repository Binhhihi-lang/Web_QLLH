<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\TietHoc;
use App\Models\User;
use Database\Seeders\TietHocSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuoiHocTest extends TestCase
{
    use RefreshDatabase;

    private HocKy $ky;

    private LopHocPhan $lop;

    private PhongHoc $phong;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TietHocSeeder::class);
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');

        // Học kỳ 02/11/2026 – 10/01/2027, thứ 2 là 02/11/2026.
        $this->ky = HocKy::factory()->create([
            'ngay_bat_dau' => '2026-11-02',
            'ngay_ket_thuc' => '2027-01-10',
            'trang_thai' => HocKy::ONGOING,
        ]);
        $this->lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id]);
        $this->phong = PhongHoc::factory()->create(['trang_thai' => true]);
    }

    private function sinhLich(array $duLieu = [])
    {
        return $this->postJson("/api/sections/{$this->lop->id}/sessions/generate", [
            'thu' => [2, 4],
            'tiet_bat_dau' => 7,
            'tiet_ket_thuc' => 9,
            'phong_hoc_id' => $this->phong->id,
            'tu_ngay' => '2026-11-02',
            'den_ngay' => '2026-11-15',
            ...$duLieu,
        ]);
    }

    public function test_sinh_lich_tao_buoi_theo_thu_va_tiet(): void
    {
        $this->sinhLich()->assertCreated();

        // 02/11 (T2), 04/11 (T4), 09/11 (T2), 11/11 (T4)
        $this->assertSame(4, BuoiHoc::query()->count());

        $dau = BuoiHoc::query()->orderBy('ngay_hoc')->first();
        $this->assertSame('2026-11-02', $dau->ngay_hoc->toDateString());
        $this->assertSame(7, $dau->tiet_bat_dau);
        $this->assertSame(9, $dau->tiet_ket_thuc);
        $this->assertSame('12:30:00', $dau->gio_bat_dau);
        $this->assertSame('15:10:00', $dau->gio_ket_thuc);
        $this->assertSame(BuoiHoc::SCHEDULED, $dau->trang_thai);
    }

    public function test_sinh_lich_dung_o_ngay_ket_thuc_hoc_ky(): void
    {
        $this->sinhLich([
            'tu_ngay' => '2026-12-28',
            'den_ngay' => '2027-03-01',
        ])->assertCreated();

        // 28/12 (T2), 30/12 (T4), 04/01 (T2), 06/01 (T4) — 08/01 vượt 10/01 nên dừng.
        $this->assertSame(4, BuoiHoc::query()->count());
        $this->assertSame('2027-01-06', BuoiHoc::query()->orderByDesc('ngay_hoc')->first()->ngay_hoc->toDateString());
    }

    public function test_sinh_lich_tu_choi_khi_trung_phong_va_khong_tao_buoi_nao(): void
    {
        $this->sinhLich()->assertCreated();
        $truoc = BuoiHoc::query()->count();

        $this->sinhLich([
            'tu_ngay' => '2026-11-09',
            'den_ngay' => '2026-11-10',
        ])->assertStatus(409)->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT');

        $this->assertSame($truoc, BuoiHoc::query()->count());
    }

    public function test_sinh_lich_tu_choi_khi_hoc_ky_da_dong(): void
    {
        $this->ky->update(['trang_thai' => HocKy::CLOSED]);

        $this->sinhLich()->assertStatus(409)->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');
        $this->assertSame(0, BuoiHoc::query()->count());
    }

    public function test_sinh_lich_tu_choi_ngay_ngoai_hoc_ky(): void
    {
        $this->sinhLich(['tu_ngay' => '2026-10-01'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SESSION_OUTSIDE_SEMESTER');
    }

    public function test_them_buoi_le_tu_tiet_tu_tinh_gio(): void
    {
        $this->postJson("/api/sections/{$this->lop->id}/sessions", [
            'ngay_hoc' => '2026-11-03',
            'tiet_bat_dau' => 1,
            'tiet_ket_thuc' => 3,
            'phong_hoc_id' => $this->phong->id,
        ])->assertCreated()
            ->assertJsonPath('data.tiet_bat_dau', 1)
            ->assertJsonPath('data.gio_bat_dau', '06:30')
            ->assertJsonPath('data.gio_ket_thuc', '09:10');
    }

    public function test_huy_buoi_giu_ban_ghi_tren_lich(): void
    {
        $buoi = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $this->lop->id,
            'ngay_hoc' => '2026-11-03',
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'phong_hoc_id' => $this->phong->id,
        ]);

        $this->patchJson("/api/sessions/{$buoi->id}/status", [
            'trang_thai' => BuoiHoc::CANCELLED,
            'ly_do_huy' => 'Trường nghỉ lễ',
        ])->assertOk()->assertJsonPath('data.trang_thai', BuoiHoc::CANCELLED);

        $this->assertDatabaseHas('buoi_hoc', ['id' => $buoi->id, 'trang_thai' => BuoiHoc::CANCELLED]);
        $this->assertNull($buoi->fresh()->deleted_at);
    }

    public function test_huy_buoi_da_diem_danh_can_xac_nhan(): void
    {
        $buoi = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $this->lop->id,
            'ngay_hoc' => '2026-11-03',
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'phong_hoc_id' => $this->phong->id,
        ]);
        $sv = SinhVien::factory()->create();
        $dangKy = DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sv->id,
            'lop_hoc_phan_id' => $this->lop->id,
        ]);
        \App\Models\DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoi->id,
            'dang_ky_hoc_phan_id' => $dangKy->id,
        ]);

        $this->patchJson("/api/sessions/{$buoi->id}/status", ['trang_thai' => BuoiHoc::CANCELLED])
            ->assertStatus(409);

        $this->patchJson("/api/sessions/{$buoi->id}/status", [
            'trang_thai' => BuoiHoc::CANCELLED,
            'xac_nhan' => true,
        ])->assertOk();
    }

    public function test_sua_buoi_sang_gio_trung_thi_bao_xung_dot(): void
    {
        $this->sinhLich()->assertCreated();
        $buoi = BuoiHoc::query()->whereDate('ngay_hoc', '2026-11-04')->firstOrFail();

        $this->putJson("/api/sessions/{$buoi->id}", [
            'ngay_hoc' => '2026-11-09',
            'tiet_bat_dau' => 7,
            'tiet_ket_thuc' => 9,
            'phong_hoc_id' => $this->phong->id,
        ])->assertStatus(409)->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT');
    }

    public function test_giang_vien_lop_khac_khong_sinh_duoc_lich(): void
    {
        $gvKhac = User::factory()->giangVien()->create();
        $this->actingAs($gvKhac, 'sanctum');

        $this->sinhLich()->assertForbidden();
    }

    public function test_sinh_vien_chua_dang_ky_khong_xem_duoc_lich_lop(): void
    {
        $sinhVien = User::factory()->sinhVien()->create();
        $this->actingAs($sinhVien, 'sanctum');

        $this->getJson("/api/sections/{$this->lop->id}/sessions")->assertForbidden();
    }
}
