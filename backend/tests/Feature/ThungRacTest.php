<?php

namespace Tests\Feature;

use App\Models\MonHoc;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThungRacTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_chua_dang_nhap_khong_the_xem_thung_rac(): void
    {
        $this->getJson('/api/trash/subjects')
            ->assertUnauthorized();
    }

    public function test_sinh_vien_khong_the_xem_thung_rac(): void
    {
        $svUser = User::factory()->sinhVien()->create(['must_change_password' => false]);

        $this->actingAs($svUser, 'sanctum')
            ->getJson('/api/trash/subjects')
            ->assertForbidden();
    }

    public function test_loai_thuc_the_khong_hop_le_tra_404(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/trash/khong-ton-tai')
            ->assertNotFound();
    }

    public function test_admin_xem_danh_sach_thung_rac_mon_hoc(): void
    {
        $monHoc = MonHoc::factory()->create(['ten_mon' => 'Môn để xóa']);
        $monHoc->delete();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/trash/subjects')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    public function test_admin_khoi_phuc_mon_hoc_thanh_cong(): void
    {
        $monHoc = MonHoc::factory()->create(['ten_mon' => 'Môn khôi phục']);
        $monHoc->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/trash/subjects/{$monHoc->id}/restore")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('mon_hoc', [
            'id' => $monHoc->id,
            'deleted_at' => null,
        ]);
    }

    public function test_khoi_phuc_ban_ghi_khong_ton_tai_tra_404(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/trash/subjects/999999/restore')
            ->assertNotFound();
    }
}

