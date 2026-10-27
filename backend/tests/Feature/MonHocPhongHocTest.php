<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonHocPhongHocTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_admin_thuc_hien_crud_mon_hoc_va_ghi_nhat_ky_khi_xoa(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/subjects', [
                'ma_mon' => 'INT1001',
                'ten_mon' => 'Nhập môn lập trình',
                'so_tin_chi' => 3,
                'mo_ta' => 'Môn cơ sở',
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_mon', 'INT1001')
            ->assertJsonPath('data.da_xoa', false);

        $monHoc = MonHoc::query()->where('ma_mon', 'INT1001')->firstOrFail();

        $this->getJson("/api/subjects/{$monHoc->id}")
            ->assertOk()
            ->assertJsonPath('data.ten_mon', 'Nhập môn lập trình');

        $this->putJson("/api/subjects/{$monHoc->id}", [
            'ma_mon' => 'INT1001',
            'ten_mon' => 'Lập trình cơ bản',
            'so_tin_chi' => 4,
            'trang_thai' => false,
        ])->assertOk()
            ->assertJsonPath('data.ten_mon', 'Lập trình cơ bản')
            ->assertJsonPath('data.trang_thai', false);

        $this->deleteJson("/api/subjects/{$monHoc->id}")
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('mon_hoc', [
            'id' => $monHoc->id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'mon_hoc',
            'doi_tuong_id' => $monHoc->id,
            'hanh_dong' => NhatKy::XOA,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);
        $this->getJson("/api/subjects/{$monHoc->id}")->assertNotFound();
    }

    public function test_mon_hoc_tu_choi_ma_trung_va_so_tin_chi_ngoai_khoang(): void
    {
        MonHoc::factory()->create(['ma_mon' => 'INT1001']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/subjects', [
                'ma_mon' => 'INT1001',
                'ten_mon' => 'Môn bị trùng',
                'so_tin_chi' => 3,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        $this->postJson('/api/subjects', [
            'ma_mon' => 'INT1002',
            'ten_mon' => 'Số tín chỉ không hợp lệ',
            'so_tin_chi' => 11,
        ])->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_danh_sach_mon_hoc_tim_kiem_loc_trang_thai_va_phan_trang(): void
    {
        MonHoc::factory()->create([
            'ma_mon' => 'CS1001',
            'ten_mon' => 'Cơ sở dữ liệu',
            'trang_thai' => true,
        ]);
        MonHoc::factory()->create([
            'ma_mon' => 'CS1002',
            'ten_mon' => 'Cơ sở mạng',
            'trang_thai' => false,
        ]);
        MonHoc::factory()->create([
            'ma_mon' => 'MA1001',
            'ten_mon' => 'Toán rời rạc',
            'trang_thai' => true,
            'so_tin_chi' => 4,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/subjects?q=Cơ sở&trang_thai=false&per_page=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_mon', 'CS1002');

        $this->getJson('/api/subjects?so_tin_chi=4&trang_thai=true')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_mon', 'MA1001');

        $this->getJson('/api/subjects?so_tin_chi=11')
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_admin_thuc_hien_crud_phong_hoc_va_ghi_nhat_ky_khi_xoa(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/rooms', [
                'ma_phong' => 'A101',
                'ten_phong' => 'Phòng học A101',
                'suc_chua' => 40,
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_phong', 'A101')
            ->assertJsonPath('data.da_xoa', false);

        $phongHoc = PhongHoc::query()->where('ma_phong', 'A101')->firstOrFail();

        $this->getJson("/api/rooms/{$phongHoc->id}")
            ->assertOk()
            ->assertJsonPath('data.suc_chua', 40);

        $this->putJson("/api/rooms/{$phongHoc->id}", [
            'ma_phong' => 'A101',
            'ten_phong' => 'Phòng học mới',
            'suc_chua' => 60,
        ])->assertOk()
            ->assertJsonPath('data.ten_phong', 'Phòng học mới')
            ->assertJsonPath('data.suc_chua', 60);

        $this->deleteJson("/api/rooms/{$phongHoc->id}")
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertSoftDeleted('phong_hoc', [
            'id' => $phongHoc->id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'phong_hoc',
            'doi_tuong_id' => $phongHoc->id,
            'hanh_dong' => NhatKy::XOA,
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);
        $this->getJson("/api/rooms/{$phongHoc->id}")->assertNotFound();
    }

    public function test_phong_hoc_tu_choi_ma_trung_va_suc_chua_khong_hop_le(): void
    {
        PhongHoc::factory()->create(['ma_phong' => 'A101']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/rooms', [
                'ma_phong' => 'A101',
                'ten_phong' => 'Phòng trùng',
                'suc_chua' => 30,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        $this->postJson('/api/rooms', [
            'ma_phong' => 'A102',
            'ten_phong' => 'Phòng không sức chứa',
            'suc_chua' => 0,
        ])->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_quyen_truy_cap_danh_sach_mon_hoc_va_phong_hoc_theo_hop_dong(): void
    {
        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);

        $this->actingAs($sinhVien, 'sanctum')
            ->getJson('/api/subjects')
            ->assertOk();
        $this->getJson('/api/rooms')->assertForbidden();
        $this->postJson('/api/subjects', [
            'ma_mon' => 'INT1001',
            'ten_mon' => 'Môn học',
            'so_tin_chi' => 3,
        ])->assertForbidden();

        $this->actingAs($giangVien, 'sanctum')
            ->getJson('/api/rooms')
            ->assertOk();
    }

    public function test_cap_nhat_trang_thai_don_va_hang_loat_cho_mon_hoc_va_phong_hoc(): void
    {
        $monHoc = MonHoc::factory()->create(['trang_thai' => true]);
        $monHocKhac = MonHoc::factory()->create(['trang_thai' => true]);
        $phongHoc = PhongHoc::factory()->create(['trang_thai' => true]);
        $phongHocKhac = PhongHoc::factory()->create(['trang_thai' => true]);

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/subjects/{$monHoc->id}/status", ['trang_thai' => false])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', false);

        $this->patchJson('/api/subjects/bulk-status', [
            'ids' => [$monHocKhac->id, 999999],
            'trang_thai' => false,
        ])->assertOk()
            ->assertJsonPath('data.thanh_cong', 1)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonPath('data.chi_tiet.1.ma_loi', 'NOT_FOUND');

        $this->patchJson("/api/rooms/{$phongHoc->id}/status", ['trang_thai' => false])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', false);

        $this->patchJson('/api/rooms/bulk-status', [
            'ids' => [$phongHocKhac->id, 999999],
            'trang_thai' => false,
        ])->assertOk()
            ->assertJsonPath('data.thanh_cong', 1)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonPath('data.chi_tiet.1.ma_loi', 'NOT_FOUND');
    }

    public function test_xoa_mon_hoc_chan_lop_thuoc_hoc_ky_chua_dong_va_bulk_xu_ly_tung_dong(): void
    {
        $monHocBiChan = MonHoc::factory()->create();
        $monHocDuocXoa = MonHoc::factory()->create();
        LopHocPhan::factory()->create([
            'mon_hoc_id' => $monHocBiChan->id,
            'hoc_ky_id' => HocKy::factory()->create(['trang_thai' => HocKy::ONGOING])->id,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/subjects/{$monHocBiChan->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->postJson('/api/subjects/bulk-delete', [
            'ids' => [$monHocBiChan->id, $monHocDuocXoa->id, 999999],
        ])->assertOk()
            ->assertJsonPath('data.thanh_cong', 1)
            ->assertJsonPath('data.that_bai', 2)
            ->assertJsonPath('data.chi_tiet.0.ma_loi', 'DELETE_BLOCKED')
            ->assertJsonPath('data.chi_tiet.2.ma_loi', 'NOT_FOUND');

        $this->assertFalse($monHocBiChan->fresh()->trashed());
        $this->assertSoftDeleted('mon_hoc', ['id' => $monHocDuocXoa->id]);
    }

    public function test_xoa_phong_hoc_chan_buoi_sap_dien_ra_nhung_bulk_xu_ly_cac_dong_doc_lap(): void
    {
        $phongBiChan = PhongHoc::factory()->create();
        $phongDuocXoa = PhongHoc::factory()->create();
        $phongBuoiCu = PhongHoc::factory()->create();

        BuoiHoc::factory()->create([
            'phong_hoc_id' => $phongBiChan->id,
            'ngay_hoc' => now()->addDay()->toDateString(),
            'gio_ket_thuc' => '23:59:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);
        BuoiHoc::factory()->create([
            'phong_hoc_id' => $phongBuoiCu->id,
            'ngay_hoc' => now()->subDay()->toDateString(),
            'gio_ket_thuc' => '23:59:00',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/rooms/{$phongBiChan->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->postJson('/api/rooms/bulk-delete', [
            'ids' => [$phongBiChan->id, $phongDuocXoa->id, $phongBuoiCu->id],
        ])->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonPath('data.chi_tiet.0.ma_loi', 'DELETE_BLOCKED');

        $this->assertFalse($phongBiChan->fresh()->trashed());
        $this->assertSoftDeleted('phong_hoc', ['id' => $phongDuocXoa->id]);
        $this->assertSoftDeleted('phong_hoc', ['id' => $phongBuoiCu->id]);
    }
}
