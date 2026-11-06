<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\DangKyHocPhan;
use App\Models\DiemDanh;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiemDanhTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_giang_vien_xem_danh_sach_diem_danh_cua_lop_minh(): void
    {
        $giangVien = GiangVien::factory()->create();
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $lop = LopHocPhan::factory()->create([
            'giang_vien_id' => $giangVien->id,
            'hoc_ky_id' => $hocKy->id,
        ]);
        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $sinhVien1 = SinhVien::factory()->create();
        $sinhVien2 = SinhVien::factory()->create();

        $dk1 = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien1->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDay(),
        ]);
        $dk2 = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien2->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDay(),
        ]);

        $response = $this->actingAs($giangVien->user, 'sanctum')
            ->getJson("/api/sessions/{$buoiHoc->id}/attendance");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.buoi_hoc.id', $buoiHoc->id)
            ->assertJsonCount(2, 'data.danh_sach');
    }

    public function test_giang_vien_khong_phu_trach_lop_bi_403(): void
    {
        $giangVienPhuTrach = GiangVien::factory()->create();
        $giangVienKhac = GiangVien::factory()->create();

        $lop = LopHocPhan::factory()->create(['giang_vien_id' => $giangVienPhuTrach->id]);
        $buoiHoc = BuoiHoc::factory()->create(['lop_hoc_phan_id' => $lop->id]);
        $sv = SinhVien::factory()->create();
        $dk = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv->id,
        ]);

        // Thử xem
        $this->actingAs($giangVienKhac->user, 'sanctum')
            ->getJson("/api/sessions/{$buoiHoc->id}/attendance")
            ->assertForbidden();

        // Thử điểm danh
        $this->actingAs($giangVienKhac->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", [
                'diem_danh' => [
                    ['dang_ky_hoc_phan_id' => $dk->id, 'trang_thai' => DiemDanh::PRESENT],
                ],
            ])
            ->assertForbidden();
    }

    public function test_giang_vien_diem_danh_hang_loat_thanh_cong_va_buoi_hoc_chuyen_sang_done(): void
    {
        $giangVien = GiangVien::factory()->create();
        $lop = LopHocPhan::factory()->create(['giang_vien_id' => $giangVien->id]);
        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $sv1 = SinhVien::factory()->create();
        $sv2 = SinhVien::factory()->create();

        $dk1 = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv1->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDay(),
        ]);
        $dk2 = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv2->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDay(),
        ]);

        $payload = [
            'diem_danh' => [
                [
                    'dang_ky_hoc_phan_id' => $dk1->id,
                    'trang_thai' => DiemDanh::PRESENT,
                    'ghi_chu' => 'Đi đúng giờ',
                ],
                [
                    'dang_ky_hoc_phan_id' => $dk2->id,
                    'trang_thai' => DiemDanh::LATE,
                    'ghi_chu' => 'Muộn 10 phút',
                ],
            ],
        ];

        $response = $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.so_luong', 2)
            ->assertJsonPath('data.trang_thai_buoi_hoc', BuoiHoc::DONE);

        $this->assertDatabaseHas('diem_danh', [
            'buoi_hoc_id' => $buoiHoc->id,
            'dang_ky_hoc_phan_id' => $dk1->id,
            'trang_thai' => DiemDanh::PRESENT,
            'ghi_chu' => 'Đi đúng giờ',
        ]);

        $this->assertDatabaseHas('diem_danh', [
            'buoi_hoc_id' => $buoiHoc->id,
            'dang_ky_hoc_phan_id' => $dk2->id,
            'trang_thai' => DiemDanh::LATE,
            'ghi_chu' => 'Muộn 10 phút',
        ]);

        $this->assertEquals(BuoiHoc::DONE, $buoiHoc->fresh()->trang_thai);
    }

    public function test_diem_danh_lan_2_cap_nhat_khong_tao_trung_ban_ghi(): void
    {
        $giangVien = GiangVien::factory()->create();
        $lop = LopHocPhan::factory()->create(['giang_vien_id' => $giangVien->id]);
        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $sv = SinhVien::factory()->create();
        $dk = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDay(),
        ]);

        // Điểm danh lần 1: LATE
        $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", [
                'diem_danh' => [
                    ['dang_ky_hoc_phan_id' => $dk->id, 'trang_thai' => DiemDanh::LATE],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('diem_danh', 1);

        // Điểm danh lần 2 sửa thành PRESENT
        $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", [
                'diem_danh' => [
                    ['dang_ky_hoc_phan_id' => $dk->id, 'trang_thai' => DiemDanh::PRESENT],
                ],
            ])
            ->assertOk();

        // Không tạo bản ghi trùng
        $this->assertDatabaseCount('diem_danh', 1);
        $this->assertDatabaseHas('diem_danh', [
            'buoi_hoc_id' => $buoiHoc->id,
            'dang_ky_hoc_phan_id' => $dk->id,
            'trang_thai' => DiemDanh::PRESENT,
        ]);
    }

    public function test_chan_diem_danh_khi_hoc_ky_closed_tru_admin(): void
    {
        $giangVien = GiangVien::factory()->create();
        $hocKyClosed = HocKy::factory()->create(['trang_thai' => HocKy::CLOSED]);
        $lop = LopHocPhan::factory()->create([
            'giang_vien_id' => $giangVien->id,
            'hoc_ky_id' => $hocKyClosed->id,
        ]);
        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDay()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
        ]);

        $sv = SinhVien::factory()->create();
        $dk = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDays(5),
        ]);

        $payload = [
            'diem_danh' => [
                ['dang_ky_hoc_phan_id' => $dk->id, 'trang_thai' => DiemDanh::PRESENT],
            ],
        ];

        // Giảng viên bị chặn 409 SEMESTER_CLOSED
        $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", $payload)
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');

        // ADMIN được phép sửa (ADR-017 ngoại lệ BR-14)
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", $payload)
            ->assertOk();
    }

    public function test_chan_giang_vien_sua_diem_danh_qua_7_ngay(): void
    {
        $giangVien = GiangVien::factory()->create();
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $lop = LopHocPhan::factory()->create([
            'giang_vien_id' => $giangVien->id,
            'hoc_ky_id' => $hocKy->id,
        ]);
        // Buổi học diễn ra cách đây 10 ngày (> 7 ngày)
        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => Carbon::now()->subDays(10)->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
        ]);

        $sv = SinhVien::factory()->create();
        $dk = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sv->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => Carbon::now()->subDays(15),
        ]);

        $payload = [
            'diem_danh' => [
                ['dang_ky_hoc_phan_id' => $dk->id, 'trang_thai' => DiemDanh::PRESENT],
            ],
        ];

        // Giảng viên bị chặn 409 ATTENDANCE_EDIT_EXPIRED
        $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", $payload)
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'ATTENDANCE_EDIT_EXPIRED');

        // ADMIN vẫn sửa được
        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", $payload)
            ->assertOk();
    }

    public function test_chan_dang_ky_khong_thuoc_lop_hoc_phan(): void
    {
        $giangVien = GiangVien::factory()->create();
        $lop1 = LopHocPhan::factory()->create(['giang_vien_id' => $giangVien->id]);
        $lop2 = LopHocPhan::factory()->create();

        $buoiHoc = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop1->id,
            'ngay_hoc' => now()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
        ]);

        $sv = SinhVien::factory()->create();
        $dkLop2 = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop2->id,
            'sinh_vien_id' => $sv->id,
        ]);

        $this->actingAs($giangVien->user, 'sanctum')
            ->putJson("/api/sessions/{$buoiHoc->id}/attendance", [
                'diem_danh' => [
                    ['dang_ky_hoc_phan_id' => $dkLop2->id, 'trang_thai' => DiemDanh::PRESENT],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'ENROLLMENT_NOT_IN_SECTION');
    }

    public function test_sinh_vien_xem_diem_danh_cua_toi_va_thong_ke_chuyen_can(): void
    {
        $giangVien = GiangVien::factory()->create();
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $lop = LopHocPhan::factory()->create([
            'giang_vien_id' => $giangVien->id,
            'hoc_ky_id' => $hocKy->id,
        ]);

        $buoi1 = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDays(2)->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'trang_thai' => BuoiHoc::DONE,
        ]);
        $buoi2 = BuoiHoc::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'ngay_hoc' => now()->subDay()->toDateString(),
            'gio_bat_dau' => '07:00',
            'gio_ket_thuc' => '09:00',
            'trang_thai' => BuoiHoc::DONE,
        ]);

        $sinhVien = SinhVien::factory()->create();
        $dk = DangKyHocPhan::factory()->create([
            'lop_hoc_phan_id' => $lop->id,
            'sinh_vien_id' => $sinhVien->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
            'dang_ky_luc' => now()->subDays(5),
        ]);

        // Buổi 1: PRESENT, Buổi 2: LATE
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoi1->id,
            'dang_ky_hoc_phan_id' => $dk->id,
            'trang_thai' => DiemDanh::PRESENT,
        ]);
        DiemDanh::factory()->create([
            'buoi_hoc_id' => $buoi2->id,
            'dang_ky_hoc_phan_id' => $dk->id,
            'trang_thai' => DiemDanh::LATE,
        ]);

        // Sinh viên xem lịch sử điểm danh từng buổi
        $resLichSu = $this->actingAs($sinhVien->user, 'sanctum')
            ->getJson('/api/me/attendance')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(2, $resLichSu->json('data'));

        // Sinh viên xem thống kê chuyên cần
        $resThongKe = $this->actingAs($sinhVien->user, 'sanctum')
            ->getJson('/api/me/attendance-summary')
            ->assertOk()
            ->assertJsonPath('success', true);

        $thongKeLop = $resThongKe->json('data.0');
        $this->assertEquals($lop->id, $thongKeLop['lop_hoc_phan']['id']);
        $this->assertEquals(2, $thongKeLop['tong_so_buoi']);
        $this->assertEquals(1, $thongKeLop['co_mat']);
        $this->assertEquals(1, $thongKeLop['di_muon']);
        $this->assertEquals(0, $thongKeLop['vang']);
        // Tỷ lệ = (1 + 1) / (1 + 1) = 1.0 (100%)
        $this->assertEquals(1.0, $thongKeLop['ty_le']);
    }
}
