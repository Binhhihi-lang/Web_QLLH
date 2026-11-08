<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\HocKy;
use App\Models\LichThi;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\PhongHoc;
use App\Models\SinhVien;
use App\Models\User;
use Database\Seeders\TietHocSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LichThiTest extends TestCase
{
    use RefreshDatabase;

    private HocKy $ky;

    private MonHoc $mon;

    private PhongHoc $phong;

    protected function setUp(): void
    {
        parent::setUp();
        // Cố định thời điểm để ngày thi trong test không bao giờ trôi vào quá khứ
        // — PAST_DATE sẽ chặn và làm test đỏ theo thời gian thực.
        $this->travelTo('2026-11-05 08:00:00');
        $this->seed(TietHocSeeder::class);
        $this->actingAs(User::factory()->admin()->create(), 'sanctum');

        $this->ky = HocKy::factory()->create([
            'ngay_bat_dau' => '2026-11-02',
            'ngay_ket_thuc' => '2027-01-10',
            'trang_thai' => HocKy::ONGOING,
        ]);
        $this->mon = MonHoc::factory()->create(['ma_mon' => 'INT3306', 'ten_mon' => 'Lập trình web']);
        $this->phong = PhongHoc::factory()->create(['trang_thai' => true]);
    }

    private function taoCa(array $duLieu = [])
    {
        return $this->postJson('/api/exams', [
            'hoc_ky_id' => $this->ky->id,
            'mon_hoc_id' => $this->mon->id,
            'ngay_thi' => '2026-11-07',
            'tiet_bat_dau' => 1,
            'tiet_ket_thuc' => 3,
            'phong_hoc_id' => $this->phong->id,
            'dot_thi' => 'Cuối kỳ',
            ...$duLieu,
        ]);
    }

    public function test_tao_ca_thi_tu_tinh_gio_tu_tiet(): void
    {
        $this->taoCa()
            ->assertCreated()
            ->assertJsonPath('data.ngay_thi', '2026-11-07')
            ->assertJsonPath('data.gio_bat_dau', '06:30')
            ->assertJsonPath('data.gio_ket_thuc', '09:10')
            ->assertJsonPath('data.mon_hoc.ma_mon', 'INT3306')
            ->assertJsonPath('data.dot_thi', 'Cuối kỳ');

        $this->assertSame(1, LichThi::query()->count());
    }

    public function test_trung_phong_cung_ngay_cung_gio_tra_409(): void
    {
        $this->taoCa()->assertCreated();

        $this->taoCa(['mon_hoc_id' => MonHoc::factory()->create()->id])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT');
    }

    public function test_khac_phong_cung_gio_khong_trung(): void
    {
        $this->taoCa()->assertCreated();

        $this->taoCa([
            'mon_hoc_id' => MonHoc::factory()->create()->id,
            'phong_hoc_id' => PhongHoc::factory()->create()->id,
        ])->assertCreated();

        $this->assertSame(2, LichThi::query()->count());
    }

    public function test_ngay_thi_ngoai_hoc_ky_bi_chan(): void
    {
        $this->taoCa(['ngay_thi' => '2026-10-30'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SESSION_OUTSIDE_SEMESTER');
    }

    public function test_hoc_ky_da_dong_khong_cho_tao(): void
    {
        $this->ky->update(['trang_thai' => HocKy::CLOSED]);

        $this->taoCa()->assertStatus(409)->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');
    }

    public function test_sua_ca_thi_giu_duoc_ca_thi_dang_sua(): void
    {
        $id = $this->taoCa()->json('data.id');

        $this->putJson("/api/exams/{$id}", [
            'ngay_thi' => '2026-11-07',
            'tiet_bat_dau' => 4,
            'tiet_ket_thuc' => 6,
        ])->assertOk()->assertJsonPath('data.tiet_bat_dau', 4);
    }

    public function test_sinh_vien_chi_thay_ca_thi_cua_mon_da_dang_ky(): void
    {
        $monKhac = MonHoc::factory()->create(['ma_mon' => 'INT2203', 'ten_mon' => 'Cơ sở dữ liệu']);
        $this->taoCa();
        $this->taoCa([
            'mon_hoc_id' => $monKhac->id,
            'phong_hoc_id' => PhongHoc::factory()->create()->id,
            'ngay_thi' => '2026-11-08',
        ]);

        $sinhVien = SinhVien::factory()->create();
        $lop = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->ky->id,
            'mon_hoc_id' => $this->mon->id,
        ]);
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lop->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($sinhVien->user, 'sanctum');

        $duLieu = $this->getJson('/api/exams')->assertOk()->json('data');

        $this->assertCount(1, $duLieu);
        $this->assertSame('INT3306', $duLieu[0]['mon_hoc']['ma_mon']);
    }

    public function test_giang_vien_khong_tao_duoc_ca_thi(): void
    {
        $this->actingAs(User::factory()->giangVien()->create(), 'sanctum');

        $this->taoCa()->assertForbidden();
    }

    public function test_khong_xep_duoc_ca_thi_cho_ngay_da_qua(): void
    {
        // Trong khoảng học kỳ nhưng trước mốc travelTo 2026-11-05.
        $this->taoCa(['ngay_thi' => '2026-11-02'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'PAST_DATE');
    }

    public function test_ca_thi_khong_duoc_de_len_buoi_hoc_cung_phong(): void
    {
        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '06:30',
            'gio_ket_thuc' => '09:10',
            'phong_hoc_id' => $this->phong->id,
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $this->taoCa(['ngay_thi' => '2026-11-10'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT')
            ->assertJsonPath('errors.trung_lich.0.loai', 'buoi_hoc');
    }

    public function test_buoi_hoc_khong_duoc_de_len_ca_thi_cung_phong(): void
    {
        $this->taoCa(['ngay_thi' => '2026-11-10'])->assertCreated();

        $lop = LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id]);
        $this->postJson("/api/sections/{$lop->id}/sessions", [
            'ngay_hoc' => '2026-11-10',
            'tiet_bat_dau' => 1,
            'tiet_ket_thuc' => 3,
            'phong_hoc_id' => $this->phong->id,
        ])->assertStatus(409)->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT');
    }

    public function test_chan_ca_thi_khi_sinh_vien_cua_mon_dang_hoc_lop_khac(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $lopThi = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->ky->id,
            'mon_hoc_id' => $this->mon->id,
        ]);
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopThi->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        // Một lớp KHÁC môn, cùng sinh viên, có buổi học đúng giờ ca thi.
        $lopKhac = LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopKhac->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '06:30',
            'gio_ket_thuc' => '09:10',
            'phong_hoc_id' => PhongHoc::factory()->create()->id,
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopKhac->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->taoCa(['ngay_thi' => '2026-11-10'])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SCHEDULE_CONFLICT')
            ->assertJsonPath('errors.trung_lich.0.ma_sv', $sinhVien->ma_sv)
            ->assertJsonPath('errors.tong_so_vi_pham', 1);
    }

    public function test_ca_thi_khac_gio_voi_lich_hoc_thi_cho_tao(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $lopThi = LopHocPhan::factory()->create([
            'hoc_ky_id' => $this->ky->id,
            'mon_hoc_id' => $this->mon->id,
        ]);
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopThi->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $lopKhac = LopHocPhan::factory()->create(['hoc_ky_id' => $this->ky->id]);
        BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lopKhac->id,
            'ngay_hoc' => '2026-11-10',
            'gio_bat_dau' => '10:15',
            'gio_ket_thuc' => '12:45',
            'phong_hoc_id' => PhongHoc::factory()->create()->id,
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopKhac->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        // Ca thi tiết 1–3 kết thúc 09:10, buổi học bắt đầu 10:15 → không giao.
        $this->taoCa(['ngay_thi' => '2026-11-10'])->assertCreated();
    }
}
