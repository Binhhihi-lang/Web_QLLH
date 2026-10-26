<?php

namespace Tests\Feature;

use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\NhatKy;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class QuanLyTuan3Test extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_admin_tao_sinh_vien_kem_tai_khoan_va_mat_khau_mot_lan(): void
    {
        $lop = LopHanhChinh::factory()->create();

        $phanHoi = $this->actingAs($this->admin, 'sanctum')->postJson('/api/students', [
            'ma_sv' => 'SV-T3-001',
            'ho_ten' => 'Nguyễn Văn Tiến',
            'ngay_sinh' => '2004-10-20',
            'gioi_tinh' => true,
            'email' => 'tien.sv@example.com',
            'so_dien_thoai' => '0901234567',
            'dia_chi' => 'Hà Nội',
            'lop_hanh_chinh_id' => $lop->id,
            'trang_thai' => true,
        ]);

        $phanHoi->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ma_sv', 'SV-T3-001')
            ->assertJsonPath('data.lop_hanh_chinh.id', $lop->id)
            ->assertJsonStructure(['data' => ['mat_khau_ban_dau']]);

        $matKhau = $phanHoi->json('data.mat_khau_ban_dau');
        $this->assertSame(12, strlen($matKhau));
        $nguoiDung = User::where('email', 'tien.sv@example.com')->firstOrFail();
        $this->assertTrue(Hash::check($matKhau, $nguoiDung->password));
        $this->assertTrue($nguoiDung->must_change_password);
        $this->assertSame(User::SINH_VIEN, $nguoiDung->vai_tro);

        $this->actingAs($this->admin, 'sanctum')->getJson('/api/students/'.$phanHoi->json('data.id'))
            ->assertOk()
            ->assertJsonMissing(['mat_khau_ban_dau' => $matKhau]);
    }

    public function test_admin_tao_giang_vien_kem_tai_khoan(): void
    {
        $phanHoi = $this->actingAs($this->admin, 'sanctum')->postJson('/api/teachers', [
            'ma_gv' => 'GV-T3-001',
            'ho_ten' => 'Trần Giảng Viên',
            'email' => 'teacher.t3@example.com',
            'so_dien_thoai' => '0912345678',
            'chuyen_mon' => 'Công nghệ phần mềm',
        ]);

        $phanHoi->assertCreated()->assertJsonStructure(['data' => ['mat_khau_ban_dau']]);
        $nguoiDung = User::where('email', 'teacher.t3@example.com')->firstOrFail();
        $this->assertSame(User::GIANG_VIEN, $nguoiDung->vai_tro);
        $this->assertTrue($nguoiDung->must_change_password);
    }

    public function test_email_phai_duy_nhat_tren_toan_he_thong(): void
    {
        User::factory()->create(['email' => 'dadung@example.com']);

        $this->actingAs($this->admin, 'sanctum')->postJson('/api/students', [
            'ma_sv' => 'SV-T3-002',
            'ho_ten' => 'Sinh Viên Trùng Email',
            'email' => 'dadung@example.com',
        ])->assertUnprocessable()->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_khoa_sinh_vien_dong_bo_tai_khoan_thu_hoi_token_va_ghi_nhat_ky(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $sinhVien->user->createToken('dien-thoai');
        $sinhVien->user->createToken('may-tinh');

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/students/{$sinhVien->id}/status", ['trang_thai' => false])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', false);

        $this->assertFalse($sinhVien->fresh()->trang_thai);
        $this->assertFalse($sinhVien->user->fresh()->trang_thai);
        $this->assertSame(0, $sinhVien->user->tokens()->count());
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'sinh_vien',
            'doi_tuong_id' => $sinhVien->id,
            'hanh_dong' => NhatKy::KHOA,
        ]);
    }

    public function test_bulk_status_xu_ly_doc_lap_va_luon_tra_200(): void
    {
        $mot = SinhVien::factory()->create();
        $hai = SinhVien::factory()->create();

        $this->actingAs($this->admin, 'sanctum')->patchJson('/api/students/bulk-status', [
            'ids' => [$mot->id, 999999, $hai->id],
            'trang_thai' => false,
        ])->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonPath('data.chi_tiet.1.ma_loi', 'NOT_FOUND');

        $this->assertFalse($mot->fresh()->trang_thai);
        $this->assertFalse($hai->fresh()->trang_thai);
    }

    public function test_bulk_status_sinh_vien_xu_ly_nhieu_ban_ghi_bang_so_truy_van_co_gioi_han(): void
    {
        $lop = LopHanhChinh::factory()->create();
        $sinhViens = SinhVien::factory()->count(100)->create([
            'lop_hanh_chinh_id' => $lop->id,
        ]);
        $token = $sinhViens->first()->user->createToken('test');
        $soTruyVan = 0;

        DB::listen(function (QueryExecuted $query) use (&$soTruyVan) {
            $soTruyVan++;
        });

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson('/api/students/bulk-status', [
                'ids' => $sinhViens->modelKeys(),
                'trang_thai' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 100)
            ->assertJsonPath('data.that_bai', 0);

        $this->assertLessThan(20, $soTruyVan);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
        $this->assertSame(100, NhatKy::query()->where('hanh_dong', NhatKy::KHOA)->count());
        $this->assertSame(100, SinhVien::query()->where('trang_thai', false)->count());
    }

    public function test_bulk_status_giang_vien_dong_bo_tai_khoan_va_ghi_nhat_ky(): void
    {
        $giangViens = GiangVien::factory()->count(100)->create();
        $soTruyVan = 0;

        DB::listen(function (QueryExecuted $query) use (&$soTruyVan) {
            $soTruyVan++;
        });

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson('/api/teachers/bulk-status', [
                'ids' => $giangViens->modelKeys(),
                'trang_thai' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 100)
            ->assertJsonPath('data.that_bai', 0);

        $this->assertLessThan(20, $soTruyVan);
        $this->assertSame(100, User::query()->where('trang_thai', false)->whereIn(
            'id',
            $giangViens->pluck('user_id'),
        )->count());
        $this->assertSame(100, NhatKy::query()
            ->where('doi_tuong_loai', 'giang_vien')
            ->where('hanh_dong', NhatKy::KHOA)
            ->count());
    }

    public function test_bulk_xoa_sinh_vien_xoa_mềm_theo_lo_va_thu_hoi_token(): void
    {
        $sinhViens = SinhVien::factory()->count(100)->create();
        $token = $sinhViens->first()->user->createToken('test');
        $soTruyVan = 0;

        DB::listen(function (QueryExecuted $query) use (&$soTruyVan) {
            $soTruyVan++;
        });

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students/bulk-delete', ['ids' => $sinhViens->modelKeys()])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 100)
            ->assertJsonPath('data.that_bai', 0);

        $this->assertLessThan(20, $soTruyVan);
        $this->assertSame(100, SinhVien::onlyTrashed()->count());
        $this->assertSame(100, User::onlyTrashed()->whereIn('id', $sinhViens->pluck('user_id'))->count());
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
        $this->assertSame(100, NhatKy::query()
            ->where('doi_tuong_loai', 'sinh_vien')
            ->where('hanh_dong', NhatKy::XOA)
            ->count());
    }

    public function test_bulk_xoa_giang_vien_xoa_mềm_theo_lo_va_thu_hoi_token(): void
    {
        $giangViens = GiangVien::factory()->count(100)->create();
        $token = $giangViens->first()->user->createToken('test');
        $soTruyVan = 0;

        DB::listen(function (QueryExecuted $query) use (&$soTruyVan) {
            $soTruyVan++;
        });

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers/bulk-delete', ['ids' => $giangViens->modelKeys()])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 100)
            ->assertJsonPath('data.that_bai', 0);

        $this->assertLessThan(20, $soTruyVan);
        $this->assertSame(100, GiangVien::onlyTrashed()->count());
        $this->assertSame(100, User::onlyTrashed()->whereIn('id', $giangViens->pluck('user_id'))->count());
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
        $this->assertSame(100, NhatKy::query()
            ->where('doi_tuong_loai', 'giang_vien')
            ->where('hanh_dong', NhatKy::XOA)
            ->count());
    }

    public function test_bulk_xoa_sinh_vien_tra_phan_tu_thanh_cong_that_bai_va_khong_ton_tai(): void
    {
        $duocXoa = SinhVien::factory()->create();
        $biChan = SinhVien::factory()->create();
        $lopHocPhan = LopHocPhan::factory()->create();
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $biChan->id,
            'lop_hoc_phan_id' => $lopHocPhan->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/students/bulk-delete', ['ids' => [$duocXoa->id, $biChan->id, 999999]])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 1)
            ->assertJsonPath('data.that_bai', 2)
            ->assertJsonPath('data.chi_tiet.1.ma_loi', 'DELETE_BLOCKED')
            ->assertJsonPath('data.chi_tiet.2.ma_loi', 'NOT_FOUND');

        $this->assertSoftDeleted('sinh_vien', ['id' => $duocXoa->id]);
        $this->assertDatabaseHas('sinh_vien', ['id' => $biChan->id, 'deleted_at' => null]);
    }

    public function test_bulk_xoa_giang_vien_van_chan_giang_vien_dang_phu_trach_lop(): void
    {
        $biChan = GiangVien::factory()->create();
        LopHocPhan::factory()->create(['giang_vien_id' => $biChan->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/teachers/bulk-delete', ['ids' => [$biChan->id]])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 0)
            ->assertJsonPath('data.that_bai', 1)
            ->assertJsonPath('data.chi_tiet.0.ma_loi', 'DELETE_BLOCKED');

        $this->assertDatabaseHas('giang_vien', ['id' => $biChan->id, 'deleted_at' => null]);
    }

    public function test_bulk_rong_bi_tu_choi(): void
    {
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/students/bulk-delete', ['ids' => []])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_danh_sach_sinh_vien_loc_trang_thai_false_va_phan_trang(): void
    {
        SinhVien::factory()->create(['ho_ten' => 'Đang hoạt động', 'trang_thai' => true]);
        SinhVien::factory()->create(['ho_ten' => 'Đã khóa', 'trang_thai' => false]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/students?trang_thai=false&per_page=10&q=%C4%90%C3%A3%20kh%C3%B3a')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.ho_ten', 'Đã khóa')
            ->assertJsonPath('data.0.trang_thai', false);
    }

    public function test_giang_vien_chi_xem_sinh_vien_dang_hoc_lop_minh_va_khong_thay_truong_nhay_cam(): void
    {
        $giangVien = GiangVien::factory()->create();
        $lopHocPhan = LopHocPhan::factory()->create(['giang_vien_id' => $giangVien->id]);
        $duocXem = SinhVien::factory()->create();
        $khongDuocXem = SinhVien::factory()->create();
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $duocXem->id,
            'lop_hoc_phan_id' => $lopHocPhan->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($giangVien->user, 'sanctum')->getJson('/api/students')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $duocXem->id)
            ->assertJsonMissingPath('data.0.ngay_sinh')
            ->assertJsonMissingPath('data.0.dia_chi');

        $this->actingAs($giangVien->user, 'sanctum')->getJson('/api/students/'.$khongDuocXem->id)
            ->assertForbidden();
    }

    public function test_cap_nhat_sinh_vien_dong_bo_ten_email_voi_tai_khoan(): void
    {
        $sinhVien = SinhVien::factory()->create();

        $this->actingAs($this->admin, 'sanctum')->putJson('/api/students/'.$sinhVien->id, [
            'ma_sv' => $sinhVien->ma_sv,
            'ho_ten' => 'Tên Mới',
            'email' => 'email-moi@example.com',
            'gioi_tinh' => false,
            'trang_thai' => true,
        ])->assertOk()
            ->assertJsonPath('data.ho_ten', 'Tên Mới')
            ->assertJsonPath('data.email', 'email-moi@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $sinhVien->user_id,
            'name' => 'Tên Mới',
            'email' => 'email-moi@example.com',
        ]);
    }

    public function test_xoa_sinh_vien_bi_chan_khi_con_dang_ky_active_o_ky_chua_dong(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $lopHocPhan = LopHocPhan::factory()->create();
        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopHocPhan->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);

        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/students/'.$sinhVien->id)
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $lopHocPhan->hocKy->update(['trang_thai' => HocKy::CLOSED]);
        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/students/'.$sinhVien->id)->assertOk();
        $this->assertSoftDeleted('sinh_vien', ['id' => $sinhVien->id]);
        $this->assertSoftDeleted('users', ['id' => $sinhVien->user_id]);
    }

    public function test_xoa_giang_vien_bi_chan_khi_con_lop_o_ky_chua_dong(): void
    {
        $giangVien = GiangVien::factory()->create();
        LopHocPhan::factory()->create(['giang_vien_id' => $giangVien->id]);

        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/teachers/'.$giangVien->id)
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');
    }

    public function test_giang_vien_chi_sua_duoc_so_dien_thoai_cua_ban_than(): void
    {
        $giangVien = GiangVien::factory()->create();

        $this->actingAs($giangVien->user, 'sanctum')->putJson('/api/teachers/'.$giangVien->id, [
            'so_dien_thoai' => '0987654321',
        ])->assertOk()->assertJsonPath('data.so_dien_thoai', '0987654321');

        $this->actingAs($giangVien->user, 'sanctum')->putJson('/api/teachers/'.$giangVien->id, [
            'so_dien_thoai' => '0987654321',
            'ho_ten' => 'Tên Không Được Đổi',
        ])->assertUnprocessable();
    }

    public function test_crud_lop_hanh_chinh_gan_go_sinh_vien_va_chan_xoa_khi_con_sinh_vien(): void
    {
        $phanHoi = $this->actingAs($this->admin, 'sanctum')->postJson('/api/admin-classes', [
            'ma_lop' => 'K65-CNTT-99',
            'ten_lop' => 'CNTT K65 lớp 99',
            'khoa_hoc' => 'K65',
            'nganh' => 'CNTT',
            'nam_nhap_hoc' => 2023,
        ])->assertCreated()->assertJsonPath('data.si_so', 0);

        $lopId = $phanHoi->json('data.id');
        $sinhVien = SinhVien::factory()->create(['lop_hanh_chinh_id' => null]);

        $this->actingAs($this->admin, 'sanctum')->postJson("/api/admin-classes/{$lopId}/students", [
            'sinh_vien_ids' => [$sinhVien->id],
        ])->assertOk()->assertJsonPath('data.so_luong', 1);

        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/admin-classes/'.$lopId)
            ->assertConflict()->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/admin-classes/{$lopId}/students/{$sinhVien->id}")->assertOk();
        $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/admin-classes/'.$lopId)->assertOk();
        $this->assertSoftDeleted('lop_hanh_chinh', ['id' => $lopId]);
    }

    public function test_nguoi_khong_phai_admin_khong_duoc_tao_sinh_vien(): void
    {
        $giangVien = GiangVien::factory()->create();

        $this->actingAs($giangVien->user, 'sanctum')->postJson('/api/students', [
            'ma_sv' => 'SV-CAM',
            'ho_ten' => 'Không được tạo',
            'email' => 'cam@example.com',
        ])->assertForbidden()->assertJsonPath('ma_loi', 'FORBIDDEN');
    }
}
