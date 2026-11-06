<?php

namespace Tests\Feature;

use App\Models\GiangVien;
use App\Models\NhatKy;
use App\Models\SinhVien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NhatKyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
    }

    public function test_admin_xem_danh_sach_nhat_ky_phan_trang(): void
    {
        NhatKy::factory()->count(15)->create([
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/logs?per_page=10');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(10, 'data')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'doi_tuong_loai',
                        'doi_tuong_loai_label',
                        'doi_tuong_id',
                        'hanh_dong',
                        'hanh_dong_label',
                        'gia_tri_cu',
                        'gia_tri_moi',
                        'ghi_chu',
                        'thoi_diem',
                        'nguoi_thuc_hien' => [
                            'id',
                            'name',
                            'email',
                            'vai_tro',
                        ],
                    ],
                ],
                'meta' => ['current_page', 'per_page', 'total'],
                'links' => ['first', 'last'],
            ]);
    }

    public function test_admin_loc_nhat_ky_theo_doi_tuong_loai_va_hanh_dong(): void
    {
        NhatKy::factory()->create([
            'doi_tuong_loai' => 'users',
            'hanh_dong' => NhatKy::KHOA,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        NhatKy::factory()->create([
            'doi_tuong_loai' => 'lop_hoc_phan',
            'hanh_dong' => NhatKy::CHOT_DIEM,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/logs?doi_tuong_loai=users&hanh_dong='.NhatKy::KHOA);

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.doi_tuong_loai', 'users')
            ->assertJsonPath('data.0.hanh_dong', NhatKy::KHOA);
    }

    public function test_admin_loc_nhat_ky_theo_khoang_thoi_gian(): void
    {
        NhatKy::factory()->create([
            'thoi_diem' => Carbon::now()->subDays(10),
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $logMoi = NhatKy::factory()->create([
            'thoi_diem' => Carbon::now()->subDays(1),
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $tuNgay = Carbon::now()->subDays(3)->toDateString();
        $denNgay = Carbon::now()->toDateString();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/logs?tu_ngay={$tuNgay}&den_ngay={$denNgay}");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $logMoi->id);
    }

    public function test_admin_tim_kiem_nhat_ky_theo_tu_khoa(): void
    {
        NhatKy::factory()->create([
            'ghi_chu' => 'Mở khóa điểm kỳ 1 do sai sót giảng viên',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        NhatKy::factory()->create([
            'ghi_chu' => 'Chuyển trạng thái học kỳ',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/logs?q='.urlencode('Mở khóa điểm'));

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.ghi_chu', 'Mở khóa điểm kỳ 1 do sai sót giảng viên');
    }

    public function test_admin_xem_chi_tiet_nhat_ky(): void
    {
        $log = NhatKy::factory()->create([
            'doi_tuong_loai' => 'hoc_ky',
            'doi_tuong_id' => 5,
            'hanh_dong' => NhatKy::DOI_TRANG_THAI,
            'gia_tri_cu' => ['trang_thai' => 'UPCOMING'],
            'gia_tri_moi' => ['trang_thai' => 'ONGOING'],
            'ghi_chu' => 'Kích hoạt học kỳ',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/logs/{$log->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $log->id)
            ->assertJsonPath('data.doi_tuong_loai', 'hoc_ky')
            ->assertJsonPath('data.gia_tri_cu.trang_thai', 'UPCOMING')
            ->assertJsonPath('data.gia_tri_moi.trang_thai', 'ONGOING');
    }

    public function test_admin_lay_danh_sach_options(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/logs/options');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'doi_tuong_loai',
                    'hanh_dong',
                ],
            ]);
    }

    public function test_giang_vien_va_sinh_vien_bi_403_khi_truy_cap_nhat_ky(): void
    {
        $giangVien = GiangVien::factory()->create();
        $sinhVien = SinhVien::factory()->create();

        $this->actingAs($giangVien->user, 'sanctum')
            ->getJson('/api/logs')
            ->assertForbidden();

        $this->actingAs($sinhVien->user, 'sanctum')
            ->getJson('/api/logs')
            ->assertForbidden();

        $this->actingAs($giangVien->user, 'sanctum')
            ->getJson('/api/logs/options')
            ->assertForbidden();
    }

    public function test_route_audit_logs_cung_tra_ve_danh_sach(): void
    {
        NhatKy::factory()->count(3)->create([
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data');
    }
}
