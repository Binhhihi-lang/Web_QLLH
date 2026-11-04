<?php

namespace Tests\Feature;

use App\Models\HocKy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HocKyTest extends TestCase
{
    use RefreshDatabase;

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
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
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
}
