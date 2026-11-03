<?php

namespace Tests\Feature;

use App\Models\GiangVien;
use App\Models\Khoa;
use App\Models\LopHanhChinh;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\User;
use Database\Seeders\DanhMucSeeder;
use Database\Seeders\GiangVienSeeder;
use Database\Seeders\KhoaNganhSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Danh mục Khoa / Ngành — ADR-020.
 *
 * Bao phủ: CRUD hai danh mục, chặn xóa khi còn ràng buộc, options cho dropdown,
 * và việc gắn khoa/ngành vào môn học, giảng viên, lớp hành chính.
 */
class KhoaNganhTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_admin_thuc_hien_crud_khoa(): void
    {
        $khoaId = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/khoa', [
                'ma_khoa' => 'CNTT',
                'ten_khoa' => 'Công nghệ thông tin',
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_khoa', 'CNTT')
            ->assertJsonPath('data.so_nganh', 0)
            ->assertJsonPath('data.da_xoa', false)
            ->json('data.id');

        $this->getJson("/api/khoa/{$khoaId}")
            ->assertOk()
            ->assertJsonPath('data.ten_khoa', 'Công nghệ thông tin');

        $this->putJson("/api/khoa/{$khoaId}", [
            'ma_khoa' => 'CNTT',
            'ten_khoa' => 'Khoa Công nghệ thông tin',
            'trang_thai' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.ten_khoa', 'Khoa Công nghệ thông tin')
            ->assertJsonPath('data.trang_thai', false);

        $this->deleteJson("/api/khoa/{$khoaId}")->assertOk()->assertJsonPath('data', null);

        $this->assertSoftDeleted('khoa', ['id' => $khoaId, 'deleted_by' => $this->admin->id]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'khoa',
            'doi_tuong_id' => $khoaId,
            'hanh_dong' => 'XOA',
        ]);
    }

    public function test_ma_khoa_trung_bi_tu_choi_ke_ca_ban_ghi_da_xoa_mem(): void
    {
        $khoa = Khoa::factory()->create(['ma_khoa' => 'CNTT']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/khoa', ['ma_khoa' => 'CNTT', 'ten_khoa' => 'Trùng mã'])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        $khoa->delete();

        $this->postJson('/api/khoa', ['ma_khoa' => 'CNTT', 'ten_khoa' => 'Trùng mã đã xóa'])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_chan_xoa_khoa_khi_con_nganh_hoac_mon_hoc(): void
    {
        $khoaConNganh = Khoa::factory()->create();
        Nganh::factory()->thuocKhoa($khoaConNganh)->create();

        $khoaConMon = Khoa::factory()->create();
        MonHoc::factory()->create(['khoa_id' => $khoaConMon->id]);

        $khoaRanh = Khoa::factory()->create();

        $this->actingAs($this->admin, 'sanctum');

        $this->deleteJson("/api/khoa/{$khoaConNganh->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/khoa/{$khoaConMon->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/khoa/{$khoaRanh->id}")->assertOk();

        $this->assertFalse($khoaConNganh->fresh()->trashed());
        $this->assertFalse($khoaConMon->fresh()->trashed());
        $this->assertSoftDeleted('khoa', ['id' => $khoaRanh->id]);
    }

    public function test_crud_nganh_va_chan_trung_ten_trong_cung_khoa(): void
    {
        $khoa = Khoa::factory()->create(['ma_khoa' => 'CNTT']);
        $khoaKhac = Khoa::factory()->create(['ma_khoa' => 'DTVT']);

        $this->actingAs($this->admin, 'sanctum');

        $nganhId = $this->postJson('/api/nganh', [
            'khoa_id' => $khoa->id,
            'ma_nganh' => 'KTPM',
            'ten_nganh' => 'Công nghệ phần mềm',
        ])
            ->assertCreated()
            ->assertJsonPath('data.khoa.ma_khoa', 'CNTT')
            ->json('data.id');

        // Trùng tên trong cùng khoa bị chặn (khớp unique của bảng).
        $this->postJson('/api/nganh', [
            'khoa_id' => $khoa->id,
            'ma_nganh' => 'KTPM2',
            'ten_nganh' => 'Công nghệ phần mềm',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        // Cùng tên nhưng khác khoa thì hợp lệ.
        $this->postJson('/api/nganh', [
            'khoa_id' => $khoaKhac->id,
            'ma_nganh' => 'KTPM3',
            'ten_nganh' => 'Công nghệ phần mềm',
        ])->assertCreated();

        $this->putJson("/api/nganh/{$nganhId}", [
            'khoa_id' => $khoa->id,
            'ma_nganh' => 'KTPM',
            'ten_nganh' => 'Kỹ thuật phần mềm',
        ])
            ->assertOk()
            ->assertJsonPath('data.ten_nganh', 'Kỹ thuật phần mềm');

        $this->deleteJson("/api/nganh/{$nganhId}")->assertOk();
        $this->assertSoftDeleted('nganh', ['id' => $nganhId, 'deleted_by' => $this->admin->id]);
    }

    public function test_nganh_bat_buoc_thuoc_khoa_ton_tai(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/nganh', [
                'khoa_id' => 999999,
                'ma_nganh' => 'KTPM',
                'ten_nganh' => 'Công nghệ phần mềm',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonStructure(['errors' => ['khoa_id']]);
    }

    public function test_chan_xoa_nganh_khi_con_giang_vien_hoac_lop_hanh_chinh(): void
    {
        $nganhConGv = Nganh::factory()->create();
        GiangVien::factory()->create(['nganh_id' => $nganhConGv->id]);

        $nganhConLop = Nganh::factory()->create();
        LopHanhChinh::factory()->create(['nganh_id' => $nganhConLop->id]);

        $nganhRanh = Nganh::factory()->create();

        $this->actingAs($this->admin, 'sanctum');

        $this->deleteJson("/api/nganh/{$nganhConGv->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/nganh/{$nganhConLop->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/nganh/{$nganhRanh->id}")->assertOk();
        $this->assertSoftDeleted('nganh', ['id' => $nganhRanh->id]);
    }

    public function test_options_khoa_va_nganh_loc_duoc_theo_khoa(): void
    {
        $khoa = Khoa::factory()->create(['ma_khoa' => 'CNTT', 'ten_khoa' => 'Công nghệ thông tin']);
        $khoaKhac = Khoa::factory()->create(['ma_khoa' => 'DTVT']);
        Nganh::factory()->thuocKhoa($khoa)->create(['ma_nganh' => 'KTPM']);
        Nganh::factory()->thuocKhoa($khoaKhac)->create(['ma_nganh' => 'DTVT01']);

        $this->actingAs($this->admin, 'sanctum');

        $this->getJson('/api/options/khoa')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.label', 'Công nghệ thông tin');

        $this->getJson('/api/options/nganh')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson("/api/options/nganh?khoa_id={$khoa->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.ma_nganh', 'KTPM')
            ->assertJsonPath('data.0.khoa_id', $khoa->id);
    }

    public function test_gan_khoa_nganh_vao_mon_hoc_giang_vien_lop_hanh_chinh(): void
    {
        $khoa = Khoa::factory()->create(['ma_khoa' => 'CNTT', 'ten_khoa' => 'Công nghệ thông tin']);
        $nganh = Nganh::factory()->thuocKhoa($khoa)->create([
            'ma_nganh' => 'KTPM',
            'ten_nganh' => 'Công nghệ phần mềm',
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Môn học: gắn khoa, resource trả khối lồng `khoa`.
        $this->postJson('/api/subjects', [
            'ma_mon' => 'INT1001',
            'ten_mon' => 'Nhập môn lập trình',
            'so_tin_chi' => 3,
            'khoa_id' => $khoa->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.khoa_id', $khoa->id)
            ->assertJsonPath('data.khoa.ten_khoa', 'Công nghệ thông tin');

        // Giảng viên: gắn ngành (thay cho cột `chuyen_mon` cũ).
        $this->postJson('/api/teachers', [
            'ma_gv' => 'GV0001',
            'ho_ten' => 'Trần Thị B',
            'email' => 'b@example.com',
            'nganh_id' => $nganh->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.nganh_id', $nganh->id)
            ->assertJsonPath('data.nganh.ma_nganh', 'KTPM')
            ->assertJsonPath('data.nganh.ten_nganh', 'Công nghệ phần mềm')
            ->assertJsonMissingPath('data.chuyen_mon');

        // Lớp hành chính: gắn ngành, và suy ra được khoa qua ngành.
        $this->postJson('/api/admin-classes', [
            'ma_lop' => 'KTPM-K65-01',
            'ten_lop' => 'Lớp KTPM-K65-01',
            'khoa_hoc' => 'K65',
            'nganh_id' => $nganh->id,
        ])
            ->assertCreated()
            ->assertJsonPath('data.nganh_id', $nganh->id)
            ->assertJsonPath('data.nganh.ten_nganh', 'Công nghệ phần mềm')
            ->assertJsonPath('data.khoa.ma_khoa', 'CNTT');
    }

    public function test_loc_mon_hoc_theo_khoa_va_giang_vien_theo_nganh_hoac_khoa(): void
    {
        $khoa = Khoa::factory()->create();
        $khoaKhac = Khoa::factory()->create();
        $nganh = Nganh::factory()->thuocKhoa($khoa)->create();
        $nganhKhac = Nganh::factory()->thuocKhoa($khoaKhac)->create();

        MonHoc::factory()->create(['khoa_id' => $khoa->id]);
        MonHoc::factory()->create(['khoa_id' => $khoaKhac->id]);
        GiangVien::factory()->create(['nganh_id' => $nganh->id]);
        GiangVien::factory()->create(['nganh_id' => $nganhKhac->id]);

        $this->actingAs($this->admin, 'sanctum');

        $this->getJson("/api/subjects?khoa_id={$khoa->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/teachers?nganh_id={$nganh->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        // Lọc theo khoa đi qua quan hệ ngành.
        $this->getJson("/api/teachers?khoa_id={$khoa->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.nganh_id', $nganh->id);

        $this->getJson("/api/admin-classes?khoa_id={$khoa->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_sinh_vien_xem_duoc_danh_muc_nhung_khong_tao_duoc(): void
    {
        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);
        Khoa::factory()->create();

        $this->actingAs($sinhVien, 'sanctum')
            ->getJson('/api/khoa')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/nganh')->assertOk();

        $this->postJson('/api/khoa', ['ma_khoa' => 'XXX', 'ten_khoa' => 'Không được phép'])
            ->assertForbidden();

        $this->postJson('/api/nganh', [
            'khoa_id' => Khoa::query()->value('id'),
            'ma_nganh' => 'XXX',
            'ten_nganh' => 'Không được phép',
        ])->assertForbidden();
    }

    public function test_khoa_nganh_vao_thung_rac_duoc(): void
    {
        $khoa = Khoa::factory()->create(['ma_khoa' => 'CNTT']);
        $khoa->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/trash/khoa')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_khoa', 'CNTT');

        $this->postJson("/api/trash/khoa/{$khoa->id}/restore")->assertOk();

        $this->assertFalse(Khoa::query()->find($khoa->id)->trashed());
    }

    public function test_seeder_khoa_nganh_chay_lai_khong_nhan_ban(): void
    {
        $this->seed(KhoaNganhSeeder::class);
        $this->seed(KhoaNganhSeeder::class);

        $this->assertSame(1, Khoa::query()->count());
        $this->assertSame(5, Nganh::query()->count());
        $this->assertSame('CNTT', Khoa::query()->value('ma_khoa'));

        // Cả 5 ngành đều thuộc khoa CNTT.
        $this->assertSame(5, Nganh::query()->whereHas(
            'khoa',
            fn ($khoa) => $khoa->where('ma_khoa', 'CNTT'),
        )->count());
    }

    public function test_seeder_danh_muc_va_giang_vien_gan_dung_khoa_nganh(): void
    {
        // GiangVienSeeder gắn hồ sơ demo vào tài khoản giangvien@example.com do
        // UserSeeder tạo, nên phải seed theo đúng thứ tự của DatabaseSeeder.
        $this->seed(UserSeeder::class);
        $this->seed(KhoaNganhSeeder::class);
        $this->seed(DanhMucSeeder::class);
        $this->seed(GiangVienSeeder::class);

        $idNganh = Nganh::query()->pluck('id');

        // Môn học nào cũng có khoa (dữ liệu mẫu chỉ có khoa CNTT).
        $this->assertSame(0, MonHoc::query()->whereNull('khoa_id')->count());
        $this->assertSame(MonHoc::query()->count(), MonHoc::query()
            ->whereIn('khoa_id', Khoa::query()->pluck('id'))->count());

        // Lớp hành chính: 20 lớp, không lớp nào thiếu ngành, và ngành phải nằm trong danh mục.
        $this->assertSame(20, LopHanhChinh::query()->count());
        $this->assertSame(0, LopHanhChinh::query()->whereNull('nganh_id')->count());
        $this->assertSame(
            LopHanhChinh::query()->count(),
            LopHanhChinh::query()->whereIn('nganh_id', $idNganh)->count(),
        );

        // Giảng viên: cũng không còn dòng nào thiếu ngành.
        $this->assertSame(0, GiangVien::query()->whereNull('nganh_id')->count());
        $this->assertSame(
            GiangVien::query()->count(),
            GiangVien::query()->whereIn('nganh_id', $idNganh)->count(),
        );
    }
}
