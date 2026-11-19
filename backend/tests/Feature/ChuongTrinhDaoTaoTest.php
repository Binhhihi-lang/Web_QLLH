<?php

namespace Tests\Feature;

use App\Models\ChuongTrinhDaoTao;
use App\Models\ChuongTrinhMon;
use App\Models\Khoa;
use App\Models\LopHanhChinh;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Chương trình đào tạo — ADR-016 (bổ sung 2026-11-13).
 *
 * Bao phủ: CRUD chương trình, chặn trùng `(nganh_id, khoa_hoc)` / `ma_ctdt`,
 * thêm–sửa–gỡ môn, import từng dòng độc lập (BR-31) và chương trình của
 * chính sinh viên nhóm theo kỳ thứ.
 */
class ChuongTrinhDaoTaoTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_admin_thuc_hien_crud_chuong_trinh_dao_tao(): void
    {
        $nganh = Nganh::factory()->create(['ma_nganh' => 'KTPM']);

        $id = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/curriculums', [
                'ma_ctdt' => 'CT-KTPM-K68',
                'nganh_id' => $nganh->id,
                'khoa_hoc' => 'K68',
                'ten' => 'Công nghệ phần mềm — Khóa 68',
            ])
            ->assertCreated()
            ->assertJsonPath('data.ma_ctdt', 'CT-KTPM-K68')
            ->assertJsonPath('data.nganh.ma_nganh', 'KTPM')
            ->assertJsonPath('data.so_mon', 0)
            ->assertJsonPath('data.da_xoa', false)
            ->json('data.id');

        $this->getJson("/api/curriculums/{$id}")
            ->assertOk()
            ->assertJsonPath('data.ten', 'Công nghệ phần mềm — Khóa 68');

        $this->putJson("/api/curriculums/{$id}", [
            'ma_ctdt' => 'CT-KTPM-K68',
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K68',
            'ten' => 'Kỹ thuật phần mềm — Khóa 68',
            'trang_thai' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.ten', 'Kỹ thuật phần mềm — Khóa 68')
            ->assertJsonPath('data.trang_thai', false);

        $this->deleteJson("/api/curriculums/{$id}")->assertOk()->assertJsonPath('data', null);

        $this->assertSoftDeleted('chuong_trinh_dao_tao', [
            'id' => $id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'chuong_trinh_dao_tao',
            'doi_tuong_id' => $id,
            'hanh_dong' => 'XOA',
        ]);
    }

    public function test_giang_vien_va_sinh_vien_chi_duoc_doc(): void
    {
        $chuongTrinh = ChuongTrinhDaoTao::factory()->create();
        $monHoc = MonHoc::factory()->create();
        $dongMon = ChuongTrinhMon::query()->create([
            'chuong_trinh_id' => $chuongTrinh->id,
            'mon_hoc_id' => $monHoc->id,
            'ky_thu' => 1,
            'bat_buoc' => true,
        ]);

        foreach ([User::factory()->giangVien()->create(['must_change_password' => false]),
            User::factory()->sinhVien()->create(['must_change_password' => false])] as $nguoiDung) {
            $this->actingAs($nguoiDung, 'sanctum');

            $this->getJson('/api/curriculums')->assertOk();
            $this->getJson("/api/curriculums/{$chuongTrinh->id}")->assertOk();

            $this->postJson('/api/curriculums', [
                'ma_ctdt' => 'CT-KHONG-DUOC',
                'nganh_id' => $chuongTrinh->nganh_id,
                'khoa_hoc' => 'K69',
                'ten' => 'Không được phép',
            ])->assertForbidden();

            $this->putJson("/api/curriculums/{$chuongTrinh->id}", [
                'ma_ctdt' => $chuongTrinh->ma_ctdt,
                'nganh_id' => $chuongTrinh->nganh_id,
                'khoa_hoc' => $chuongTrinh->khoa_hoc,
                'ten' => 'Không được phép',
            ])->assertForbidden();

            $this->deleteJson("/api/curriculums/{$chuongTrinh->id}")->assertForbidden();

            $this->postJson("/api/curriculums/{$chuongTrinh->id}/subjects", [
                'mon_hoc_ids' => [$monHoc->id],
            ])->assertForbidden();

            $this->putJson("/api/curriculums/{$chuongTrinh->id}/subjects/{$dongMon->id}", [
                'ky_thu' => 2,
            ])->assertForbidden();

            $this->deleteJson("/api/curriculums/{$chuongTrinh->id}/subjects/{$dongMon->id}")
                ->assertForbidden();

            $this->postJson("/api/curriculums/{$chuongTrinh->id}/import", [
                'rows' => [['ma_mon' => $monHoc->ma_mon]],
            ])->assertForbidden();
        }

        $this->assertFalse($chuongTrinh->fresh()->trashed());
    }

    public function test_trung_nganh_khoa_hoc_hoac_ma_ctdt_tra_409(): void
    {
        $nganh = Nganh::factory()->create();
        ChuongTrinhDaoTao::factory()->create([
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K68',
            'ma_ctdt' => 'CT-KTPM-K68',
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Cùng ngành + cùng khóa, mã khác — unique `(nganh_id, khoa_hoc)` chặn.
        $this->postJson('/api/curriculums', [
            'ma_ctdt' => 'CT-KTPM-K68-B',
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K68',
            'ten' => 'Trùng ngành và khóa',
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DUPLICATE_CODE');

        // Cùng mã, khác khóa — unique `ma_ctdt` chặn.
        $this->postJson('/api/curriculums', [
            'ma_ctdt' => 'CT-KTPM-K68',
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K69',
            'ten' => 'Trùng mã',
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DUPLICATE_CODE');

        // Bản ghi đã xóa mềm vẫn giữ chỗ: unique index của bảng phủ cả dòng đã xóa.
        ChuongTrinhDaoTao::query()->where('ma_ctdt', 'CT-KTPM-K68')->first()->delete();

        $this->postJson('/api/curriculums', [
            'ma_ctdt' => 'CT-KTPM-K68',
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K68',
            'ten' => 'Tạo lại sau khi xóa mềm',
        ])
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DUPLICATE_CODE');
    }

    public function test_them_sua_va_go_mon_trong_chuong_trinh(): void
    {
        $chuongTrinh = ChuongTrinhDaoTao::factory()->create();
        $mon1 = MonHoc::factory()->create(['ma_mon' => 'INT1001', 'so_tin_chi' => 3]);
        $mon2 = MonHoc::factory()->create(['ma_mon' => 'INT1002', 'so_tin_chi' => 2]);
        $mon3 = MonHoc::factory()->create(['ma_mon' => 'INT2001', 'so_tin_chi' => 4]);

        $this->actingAs($this->admin, 'sanctum');

        $this->postJson("/api/curriculums/{$chuongTrinh->id}/subjects", [
            'mon_hoc_ids' => [$mon1->id, $mon2->id],
            'ky_thu' => 1,
            'bat_buoc' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.bo_qua', 0);

        // Thêm lại môn đã có thì bỏ qua, không lỗi.
        $this->postJson("/api/curriculums/{$chuongTrinh->id}/subjects", [
            'mon_hoc_ids' => [$mon1->id, $mon3->id],
            'ky_thu' => 2,
        ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 1)
            ->assertJsonPath('data.bo_qua', 1);

        $this->getJson("/api/curriculums/{$chuongTrinh->id}")
            ->assertOk()
            ->assertJsonPath('data.so_mon', 3)
            ->assertJsonPath('data.tong_tin_chi', 9)
            ->assertJsonPath('data.so_bat_buoc', 3)
            ->assertJsonPath('data.so_tu_chon', 0)
            ->assertJsonPath('data.so_mon_chua_gan_ky', 0);

        $dongMon1 = ChuongTrinhMon::query()
            ->where('chuong_trinh_id', $chuongTrinh->id)
            ->where('mon_hoc_id', $mon1->id)
            ->firstOrFail();

        $this->putJson("/api/curriculums/{$chuongTrinh->id}/subjects/{$dongMon1->id}", [
            'ky_thu' => 3,
            'bat_buoc' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.ky_thu', 3)
            ->assertJsonPath('data.bat_buoc', false)
            ->assertJsonPath('data.mon_hoc.ma_mon', 'INT1001');

        $this->getJson("/api/curriculums/{$chuongTrinh->id}")
            ->assertOk()
            ->assertJsonPath('data.so_bat_buoc', 2)
            ->assertJsonPath('data.so_tu_chon', 1);

        $this->deleteJson("/api/curriculums/{$chuongTrinh->id}/subjects/{$dongMon1->id}")
            ->assertOk();

        $this->assertDatabaseMissing('chuong_trinh_mon', ['id' => $dongMon1->id]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'chuong_trinh_dao_tao',
            'doi_tuong_id' => $chuongTrinh->id,
            'hanh_dong' => 'XOA',
        ]);
    }

    public function test_sua_mon_cua_chuong_trinh_khac_tra_404(): void
    {
        $chuongTrinh = ChuongTrinhDaoTao::factory()->create();
        $chuongTrinhKhac = ChuongTrinhDaoTao::factory()->create();
        $monHoc = MonHoc::factory()->create();
        $dongMon = ChuongTrinhMon::query()->create([
            'chuong_trinh_id' => $chuongTrinhKhac->id,
            'mon_hoc_id' => $monHoc->id,
            'ky_thu' => 1,
            'bat_buoc' => true,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/curriculums/{$chuongTrinh->id}/subjects/{$dongMon->id}", ['ky_thu' => 2])
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'NOT_FOUND');

        $this->assertSame(1, ChuongTrinhMon::query()->whereKey($dongMon->id)->value('ky_thu'));
    }

    public function test_import_mot_dong_sai_ma_mon_khong_lam_hong_cac_dong_dung(): void
    {
        $chuongTrinh = ChuongTrinhDaoTao::factory()->create();
        $mon1 = MonHoc::factory()->create(['ma_mon' => 'INT1001']);
        $mon2 = MonHoc::factory()->create(['ma_mon' => 'INT1002']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/curriculums/{$chuongTrinh->id}/import", [
                'rows' => [
                    ['ma_mon' => 'INT1001', 'ky_thu' => 1, 'bat_buoc' => true],
                    ['ma_mon' => 'KHONG_TON_TAI', 'ky_thu' => 2],
                    ['ma_mon' => 'INT1002', 'ky_thu' => 2, 'bat_buoc' => false],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonCount(3, 'data.chi_tiet')
            ->assertJsonPath('data.chi_tiet.0.ket_qua', 'THANH_CONG')
            ->assertJsonPath('data.chi_tiet.1.ma_loi', 'MON_NOT_FOUND')
            ->assertJsonPath('data.chi_tiet.2.ket_qua', 'THANH_CONG');

        // BR-31: dòng sai không rollback — hai môn đúng vẫn nằm trong chương trình.
        $this->assertSame(2, ChuongTrinhMon::query()->where('chuong_trinh_id', $chuongTrinh->id)->count());
        $this->assertDatabaseHas('chuong_trinh_mon', [
            'chuong_trinh_id' => $chuongTrinh->id,
            'mon_hoc_id' => $mon1->id,
            'ky_thu' => 1,
            'bat_buoc' => true,
        ]);
        $this->assertDatabaseHas('chuong_trinh_mon', [
            'chuong_trinh_id' => $chuongTrinh->id,
            'mon_hoc_id' => $mon2->id,
            'ky_thu' => 2,
            'bat_buoc' => false,
        ]);
    }

    public function test_sinh_vien_xem_duoc_chuong_trinh_cua_minh_nhom_theo_ky(): void
    {
        $khoa = Khoa::factory()->create();
        $nganh = Nganh::factory()->thuocKhoa($khoa)->create(['ma_nganh' => 'KTPM']);
        $lop = LopHanhChinh::factory()->create(['nganh_id' => $nganh->id, 'khoa_hoc' => 'K68']);
        $sinhVienUser = User::factory()->sinhVien()->create(['must_change_password' => false]);
        SinhVien::factory()->create([
            'user_id' => $sinhVienUser->id,
            'lop_hanh_chinh_id' => $lop->id,
        ]);

        $chuongTrinh = ChuongTrinhDaoTao::factory()->create([
            'nganh_id' => $nganh->id,
            'khoa_hoc' => 'K68',
            'ma_ctdt' => 'CT-KTPM-K68',
        ]);

        $mon1 = MonHoc::factory()->create(['ma_mon' => 'INT1001', 'so_tin_chi' => 3]);
        $mon2 = MonHoc::factory()->create(['ma_mon' => 'INT1002', 'so_tin_chi' => 2]);
        $mon3 = MonHoc::factory()->create(['ma_mon' => 'INT2001', 'so_tin_chi' => 4]);

        foreach ([[$mon1, 1], [$mon2, 1], [$mon3, 2]] as [$mon, $kyThu]) {
            ChuongTrinhMon::query()->create([
                'chuong_trinh_id' => $chuongTrinh->id,
                'mon_hoc_id' => $mon->id,
                'ky_thu' => $kyThu,
                'bat_buoc' => true,
            ]);
        }

        $this->actingAs($sinhVienUser, 'sanctum')
            ->getJson('/api/me/curriculum')
            ->assertOk()
            ->assertJsonPath('data.chuong_trinh.ma_ctdt', 'CT-KTPM-K68')
            ->assertJsonPath('data.chuong_trinh.nganh.ma_nganh', 'KTPM')
            ->assertJsonPath('data.chuong_trinh.so_mon', 3)
            ->assertJsonPath('data.chuong_trinh.tong_tin_chi', 9)
            ->assertJsonCount(2, 'data.ky')
            ->assertJsonPath('data.ky.0.ky_thu', 1)
            ->assertJsonPath('data.ky.0.so_mon', 2)
            ->assertJsonPath('data.ky.0.tong_tin_chi', 5)
            ->assertJsonPath('data.ky.0.mon.0.mon_hoc.ma_mon', 'INT1001')
            ->assertJsonPath('data.ky.1.ky_thu', 2)
            ->assertJsonPath('data.ky.1.mon.0.mon_hoc.ma_mon', 'INT2001');
    }

    public function test_sinh_vien_chua_co_chuong_trinh_tra_404(): void
    {
        $sinhVienUser = User::factory()->sinhVien()->create(['must_change_password' => false]);
        SinhVien::factory()->create(['user_id' => $sinhVienUser->id]);

        $this->actingAs($sinhVienUser, 'sanctum')
            ->getJson('/api/me/curriculum')
            ->assertNotFound()
            ->assertJsonPath('ma_loi', 'NOT_FOUND');
    }

    public function test_danh_sach_loc_khong_dau_theo_ma_ten_va_khoa_hoc(): void
    {
        $nganh = Nganh::factory()->create();
        $nganhKhac = Nganh::factory()->create();

        $khop = ChuongTrinhDaoTao::factory()->create([
            'nganh_id' => $nganh->id,
            'ma_ctdt' => 'CT-CNPM-K68',
            'khoa_hoc' => 'K68',
            'ten' => 'Công nghệ phần mềm — Khóa 68',
        ]);
        ChuongTrinhDaoTao::factory()->create([
            'nganh_id' => $nganhKhac->id,
            'ma_ctdt' => 'CT-DTVT-K69',
            'khoa_hoc' => 'K69',
            'ten' => 'Điện tử viễn thông — Khóa 69',
        ]);

        // Sinh viên áp dụng: đếm qua lớp hành chính cùng ngành + cùng khóa.
        $lop = LopHanhChinh::factory()->create(['nganh_id' => $nganh->id, 'khoa_hoc' => 'K68']);
        SinhVien::factory()->count(2)->create(['lop_hanh_chinh_id' => $lop->id]);

        $this->actingAs($this->admin, 'sanctum');

        // Gõ không dấu vẫn khớp tên có dấu.
        $this->getJson('/api/curriculums?q=cong nghe phan mem')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_ctdt', 'CT-CNPM-K68')
            ->assertJsonPath('data.0.so_sinh_vien', 2);

        $this->getJson('/api/curriculums?khoa_hoc=K69')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ma_ctdt', 'CT-DTVT-K69');

        $this->getJson("/api/curriculums?nganh_id={$nganh->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson('/api/curriculums?q=khong-co-gi')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_chuong_trinh_da_xoa_khong_con_trong_danh_sach(): void
    {
        $conLai = ChuongTrinhDaoTao::factory()->create();
        $daXoa = ChuongTrinhDaoTao::factory()->create();
        $daXoa->delete();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/curriculums')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $conLai->id);
    }
}
