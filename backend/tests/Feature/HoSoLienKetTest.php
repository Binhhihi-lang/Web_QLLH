<?php

namespace Tests\Feature;

use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Hồ sơ sinh viên trả khóa/ngành; quyền xem danh sách giảng viên và lớp hành
 * chính theo BR-03/BR-04.
 */
class HoSoLienKetTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_ho_so_sinh_vien_tra_khoa_nam_nhap_hoc_va_nganh(): void
    {
        $lop = LopHanhChinh::factory()->create([
            'khoa_hoc' => 'K68',
            'nam_nhap_hoc' => 2023,
        ]);
        $sinhVien = SinhVien::factory()->create(['lop_hanh_chinh_id' => $lop->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/students')
            ->assertOk()
            ->assertJsonPath('data.0.lop_hanh_chinh.khoa_hoc', 'K68')
            ->assertJsonPath('data.0.lop_hanh_chinh.nam_nhap_hoc', 2023)
            ->assertJsonPath('data.0.lop_hanh_chinh.nganh.id', $lop->nganh->id)
            ->assertJsonPath('data.0.lop_hanh_chinh.nganh.ma_nganh', $lop->nganh->ma_nganh);

        $this->getJson("/api/students/{$sinhVien->id}")
            ->assertOk()
            ->assertJsonPath('data.lop_hanh_chinh.khoa_hoc', 'K68')
            ->assertJsonPath('data.lop_hanh_chinh.nganh.ten_nganh', $lop->nganh->ten_nganh);
    }

    public function test_loc_sinh_vien_theo_nganh(): void
    {
        // Factory mặc định dùng lại ngành có sẵn, nên phải chỉ định hai ngành khác
        // nhau thì bộ lọc mới có ý nghĩa.
        $nganhA = Nganh::factory()->create();
        $nganhB = Nganh::factory()->create();
        $lopCntt = LopHanhChinh::factory()->create(['nganh_id' => $nganhA->id]);
        $lopKhac = LopHanhChinh::factory()->create(['nganh_id' => $nganhB->id]);
        $svCntt = SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopCntt->id]);
        SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopKhac->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/students?nganh_id='.$nganhA->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $svCntt->id);
    }

    public function test_sinh_vien_xem_danh_sach_giang_vien_chi_nhan_khoi_lien_he(): void
    {
        GiangVien::factory()->count(3)->create();
        $sinhVien = SinhVien::factory()->create();
        $taiKhoanSv = $sinhVien->user;
        $taiKhoanSv->update(['must_change_password' => false]);

        $this->actingAs($taiKhoanSv, 'sanctum')
            ->getJson('/api/teachers')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            // Khối liên hệ không có các trường nội bộ.
            ->assertJsonMissingPath('data.0.trang_thai')
            ->assertJsonMissingPath('data.0.nganh')
            ->assertJsonMissingPath('data.0.da_xoa')
            ->assertJsonStructure(['data' => [['id', 'ma_gv', 'ho_ten', 'email', 'so_dien_thoai', 'avatar_url']]]);
    }

    public function test_giang_vien_va_admin_van_nhan_day_du_ho_so_giang_vien(): void
    {
        GiangVien::factory()->create();
        $taiKhoanGv = User::factory()->giangVien()->create(['must_change_password' => false]);
        GiangVien::factory()->create(['user_id' => $taiKhoanGv->id]);

        foreach ([$this->admin, $taiKhoanGv] as $nguoiDung) {
            $this->actingAs($nguoiDung, 'sanctum')
                ->getJson('/api/teachers')
                ->assertOk()
                ->assertJsonPath('data.0.trang_thai', true)
                ->assertJsonStructure(['data' => [['ma_gv', 'ho_ten', 'nganh_id', 'trang_thai', 'da_xoa']]]);
        }
    }

    public function test_giang_vien_chi_thay_lop_hanh_chinh_co_sinh_vien_minh_day(): void
    {
        [$taiKhoanGv, $giangVien] = $this->giangVienCoTaiKhoan();

        $lopCuaToi = LopHanhChinh::factory()->create();
        $lopNguoiKhac = LopHanhChinh::factory()->create();

        $this->dangKyVaoLop(SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopCuaToi->id]), $giangVien);
        $this->dangKyVaoLop(
            SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopNguoiKhac->id]),
            GiangVien::factory()->create(),
        );

        $this->actingAs($taiKhoanGv, 'sanctum')
            ->getJson('/api/admin-classes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $lopCuaToi->id);

        $this->getJson("/api/admin-classes/{$lopCuaToi->id}")->assertOk();
        $this->getJson("/api/admin-classes/{$lopCuaToi->id}/students")->assertOk();
        $this->getJson("/api/admin-classes/{$lopNguoiKhac->id}")->assertForbidden();
        $this->getJson("/api/admin-classes/{$lopNguoiKhac->id}/students")->assertForbidden();
    }

    public function test_sinh_vien_chi_thay_lop_hanh_chinh_cua_minh(): void
    {
        $lopCuaToi = LopHanhChinh::factory()->create();
        $lopKhac = LopHanhChinh::factory()->create();
        $sinhVien = SinhVien::factory()->create(['lop_hanh_chinh_id' => $lopCuaToi->id]);
        $sinhVien->user->update(['must_change_password' => false]);

        $this->actingAs($sinhVien->user, 'sanctum')
            ->getJson('/api/admin-classes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $lopCuaToi->id);

        $this->getJson("/api/admin-classes/{$lopKhac->id}")
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');
    }

    /**
     * @return array{0: User, 1: GiangVien}
     */
    private function giangVienCoTaiKhoan(): array
    {
        $taiKhoan = User::factory()->giangVien()->create(['must_change_password' => false]);
        $giangVien = GiangVien::factory()->create(['user_id' => $taiKhoan->id]);

        return [$taiKhoan, $giangVien];
    }

    private function dangKyVaoLop(SinhVien $sinhVien, GiangVien $giangVien): void
    {
        $lopHp = LopHocPhan::factory()->create([
            'giang_vien_id' => $giangVien->id,
            'mon_hoc_id' => MonHoc::factory()->create(['trang_thai' => true])->id,
        ]);

        DangKyHocPhan::factory()->create([
            'sinh_vien_id' => $sinhVien->id,
            'lop_hoc_phan_id' => $lopHp->id,
            'trang_thai' => DangKyHocPhan::ACTIVE,
        ]);
    }
}
