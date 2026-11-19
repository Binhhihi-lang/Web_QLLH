<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhDaoTao;
use App\Models\ChuongTrinhMon;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\Khoa;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mở lớp hàng loạt theo chương trình đào tạo (2026-11-13).
 *
 * Luồng chính của ADMIN khi chuẩn bị một học kỳ: chọn chương trình + kỳ thứ,
 * hệ thống mở lớp cho toàn bộ môn của kỳ đó — thay vì mở lẻ từng môn.
 */
class MoLopTheoChuongTrinhTest extends TestCase
{
    use RefreshDatabase;

    private function dungChuongTrinh(string $maLopHanhChinh = '68PM9'): array
    {
        $nganh = Nganh::query()->first();
        if ($nganh === null) {
            $khoa = Khoa::factory()->create();
            $nganh = Nganh::query()->create([
                'khoa_id' => $khoa->id,
                'ma_nganh' => 'TESTPM',
                'ten_nganh' => 'Test phần mềm',
                'trang_thai' => true,
            ]);
        }

        $khoaHoc = 'K68';

        LopHanhChinh::query()->create([
            'ma_lop' => $maLopHanhChinh,
            'ten_lop' => 'Lớp '.$maLopHanhChinh,
            'khoa_hoc' => $khoaHoc,
            'nganh_id' => $nganh->id,
            'nam_nhap_hoc' => 2026,
            'trang_thai' => true,
        ]);

        $ct = ChuongTrinhDaoTao::query()->create([
            'ma_ctdt' => 'CT-TEST-'.$khoaHoc,
            'nganh_id' => $nganh->id,
            'khoa_hoc' => $khoaHoc,
            'ten' => 'Test '.$khoaHoc,
            'trang_thai' => true,
        ]);

        $monKy7a = MonHoc::factory()->create(['ma_mon' => 'TST701']);
        $monKy7b = MonHoc::factory()->create(['ma_mon' => 'TST702']);
        $monKy8 = MonHoc::factory()->create(['ma_mon' => 'TST801']);

        foreach ([[$monKy7a, 7], [$monKy7b, 7], [$monKy8, 8]] as [$mon, $ky]) {
            ChuongTrinhMon::query()->create([
                'chuong_trinh_id' => $ct->id,
                'mon_hoc_id' => $mon->id,
                'ky_thu' => $ky,
                'bat_buoc' => true,
            ]);
        }

        return [$ct, $monKy7a, $monKy7b, $monKy8];
    }

    public function test_mo_lop_hang_loat_theo_chuong_trinh_va_ky_thu(): void
    {
        [$ct, $monKy7a, $monKy7b, $monKy8] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'ky_thu' => 7,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.tao'));
        $this->assertSame(0, $response->json('data.bo_qua'));

        // Mã lớp = <mã lớp hành chính>-<mã môn>.
        $this->assertDatabaseHas('lop_hoc_phan', [
            'hoc_ky_id' => $hocKy->id,
            'ma_lop_hp' => '68PM9-TST701',
            'mon_hoc_id' => $monKy7a->id,
        ]);
        $this->assertDatabaseHas('lop_hoc_phan', [
            'hoc_ky_id' => $hocKy->id,
            'ma_lop_hp' => '68PM9-TST702',
            'mon_hoc_id' => $monKy7b->id,
        ]);
        // Môn kỳ 8 KHÔNG được mở.
        $this->assertDatabaseMissing('lop_hoc_phan', [
            'hoc_ky_id' => $hocKy->id,
            'mon_hoc_id' => $monKy8->id,
        ]);

        // Chạy lại: bỏ qua, không tạo trùng.
        $this->postJson('/api/sections/open-by-curriculum', [
            'chuong_trinh_id' => $ct->id,
            'hoc_ky_id' => $hocKy->id,
            'ky_thu' => 7,
            'giang_vien_id' => $giangVien->id,
            'si_so_toi_da' => 40,
        ])
            ->assertOk()
            ->assertJsonPath('data.tao', 0)
            ->assertJsonPath('data.bo_qua', 2);

        $this->assertSame(
            2,
            LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->count(),
            'Chạy lại không được sinh thêm lớp.',
        );
    }

    public function test_chi_admin_va_chan_hoc_ky_closed(): void
    {
        [$ct] = $this->dungChuongTrinh();

        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);

        // Giảng viên bị 403 ở route middleware.
        $this->actingAs($giangVien->user, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'ky_thu' => 7,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertForbidden();

        // Kỳ CLOSED bị chặn.
        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $kyDong = HocKy::factory()->create(['trang_thai' => HocKy::CLOSED]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $kyDong->id,
                'ky_thu' => 7,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertStatus(409)
            ->assertJsonPath('ma_loi', 'SEMESTER_CLOSED');
    }

    public function test_chan_khi_chuong_trinh_khong_co_mon_o_ky_do(): void
    {
        [$ct] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'ky_thu' => 3,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'NO_SUBJECT_IN_TERM');
    }

    public function test_tu_dong_tinh_ky_thu_khi_khong_truyen(): void
    {
        [$ct, $monKy7a, $monKy7b] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        // Khóa nhập học 2026. Học kỳ 2029-2030 kỳ 1 -> ((2029 - 2026) * 2) + 1 = 7.
        $hocKy = HocKy::factory()->create([
            'nam_hoc' => '2029-2030',
            'ky_thu' => 1,
            'trang_thai' => HocKy::ONGOING,
        ]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertOk();

        $this->assertSame(2, $response->json('data.tao'));
        $this->assertDatabaseHas('lop_hoc_phan', [
            'hoc_ky_id' => $hocKy->id,
            'ma_lop_hp' => '68PM9-TST701',
            'mon_hoc_id' => $monKy7a->id,
        ]);
    }

    public function test_chan_khoa_chua_nhap_hoc_khi_tu_dong(): void
    {
        [$ct] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create([
            'nam_hoc' => '2025-2026',
            'ky_thu' => 1,
            'trang_thai' => HocKy::ONGOING,
        ]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'COHORT_NOT_ADMITTED');
    }

    public function test_chan_khoa_da_tot_nghiep_khi_tu_dong(): void
    {
        [$ct] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        // Nhập học 2026, 2031-1 -> kỳ 11 > 8 -> tốt nghiệp.
        $hocKy = HocKy::factory()->create([
            'nam_hoc' => '2031-2032',
            'ky_thu' => 1,
            'trang_thai' => HocKy::ONGOING,
        ]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'COHORT_GRADUATED');
    }

    public function test_chan_hoc_ky_he_khi_tu_dong(): void
    {
        [$ct] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create([
            'nam_hoc' => '2026-2027',
            'ky_thu' => 3,
            'trang_thai' => HocKy::ONGOING,
        ]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'giang_vien_id' => $giangVien->id,
                'si_so_toi_da' => 40,
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'SUMMER_SEMESTER_MANUAL');
    }

    public function test_mo_lop_theo_chuong_trinh_khong_can_giang_vien(): void
    {
        [$ct, $monKy7a, $monKy7b] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);

        // Không gửi giang_vien_id
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'ky_thu' => 7,
                'si_so_toi_da' => 45,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.tao', 2)
            ->assertJsonPath('data.bo_qua', 0);

        $lop = LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->first();
        $this->assertNotNull($lop);
        $this->assertNull($lop->giang_vien_id);
    }

    public function test_mo_lop_theo_chuong_trinh_co_cau_hinh_rieng_cho_tung_mon(): void
    {
        [$ct, $monKy7a, $monKy7b] = $this->dungChuongTrinh();

        $admin = User::factory()->admin()->create(['must_change_password' => false]);
        $hocKy = HocKy::factory()->create(['trang_thai' => HocKy::ONGOING]);
        $giangVien = GiangVien::factory()->create(['trang_thai' => true]);

        // Cấu hình riêng cho monKy7a: có giảng viên và sĩ số 60
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/sections/open-by-curriculum', [
                'chuong_trinh_id' => $ct->id,
                'hoc_ky_id' => $hocKy->id,
                'ky_thu' => 7,
                'si_so_toi_da' => 40,
                'cau_hinh_mon' => [
                    [
                        'mon_hoc_id' => $monKy7a->id,
                        'giang_vien_id' => $giangVien->id,
                        'si_so_toi_da' => 60,
                    ],
                ],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.tao', 2);

        $lopA = LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->where('mon_hoc_id', $monKy7a->id)->first();
        $this->assertNotNull($lopA);
        $this->assertSame($giangVien->id, $lopA->giang_vien_id);
        $this->assertSame(60, $lopA->si_so_toi_da);

        $lopB = LopHocPhan::query()->where('hoc_ky_id', $hocKy->id)->where('mon_hoc_id', $monKy7b->id)->first();
        $this->assertNotNull($lopB);
        $this->assertNull($lopB->giang_vien_id);
        $this->assertSame(40, $lopB->si_so_toi_da);
    }
}
