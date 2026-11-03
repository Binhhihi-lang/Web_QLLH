<?php

namespace Tests\Feature;

use App\Models\GiangVien;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Quản lý tài khoản người dùng — SCR-50/SCR-51, và sửa hồ sơ cá nhân `PUT /api/me`.
 * Bao phủ FR-01, BR-30 (khóa phải thu hồi token), BR-31 (bulk xử lý từng dòng).
 */
class NguoiDungTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_admin_tao_tai_khoan_tra_mat_khau_mot_lan_va_buoc_doi_mat_khau(): void
    {
        $phanHoi = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/users', [
                'name' => 'Giảng viên mới',
                'email' => 'gvmoi@example.com',
                'vai_tro' => User::GIANG_VIEN,
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'gvmoi@example.com')
            ->assertJsonPath('data.vai_tro', User::GIANG_VIEN)
            ->assertJsonPath('data.must_change_password', true)
            ->assertJsonPath('data.ho_so', null);

        $matKhau = $phanHoi->json('data.mat_khau_ban_dau');
        $this->assertIsString($matKhau);
        $this->assertSame(12, strlen($matKhau));

        $nguoiDung = User::query()->where('email', 'gvmoi@example.com')->firstOrFail();
        $this->assertTrue(Hash::check($matKhau, $nguoiDung->password));

        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'users',
            'doi_tuong_id' => $nguoiDung->id,
            'hanh_dong' => 'TAO',
            'nguoi_thuc_hien_id' => $this->admin->id,
        ]);

        // Email trùng bị từ chối, kể cả email của bản ghi đã xóa mềm.
        $nguoiDung->delete();

        $this->postJson('/api/users', [
            'name' => 'Trùng email',
            'email' => 'gvmoi@example.com',
            'vai_tro' => User::GIANG_VIEN,
        ])->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        // Vai trò ngoài danh sách cũng bị từ chối.
        $this->postJson('/api/users', [
            'name' => 'Vai trò lạ',
            'email' => 'lala@example.com',
            'vai_tro' => 'KE_TOAN',
        ])->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_danh_sach_loc_theo_vai_tro_trang_thai_va_tim_kiem(): void
    {
        User::factory()->giangVien()->create(['name' => 'Trần Thị B', 'email' => 'b@example.com']);
        User::factory()->sinhVien()->create(['name' => 'Nguyễn Văn A', 'email' => 'a@example.com']);
        User::factory()->sinhVien()->biKhoa()->create(['name' => 'Lê Văn C', 'email' => 'c@example.com']);

        $this->actingAs($this->admin, 'sanctum');

        $this->getJson('/api/users?vai_tro=SINH_VIEN')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/users?trang_thai=false')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Lê Văn C');

        $this->getJson('/api/users?q=Nguyễn')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.email', 'a@example.com');

        $this->getJson('/api/users?vai_tro=KE_TOAN')
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_cap_nhat_tai_khoan_va_chan_email_trung(): void
    {
        $nguoiDung = User::factory()->admin()->create();
        User::factory()->create(['email' => 'dadung@example.com']);

        $this->actingAs($this->admin, 'sanctum');

        $this->putJson("/api/users/{$nguoiDung->id}", [
            'name' => 'Tên mới',
            'email' => 'moi@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Tên mới')
            ->assertJsonPath('data.email', 'moi@example.com');

        $this->putJson("/api/users/{$nguoiDung->id}", ['email' => 'dadung@example.com'])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');

        // Cập nhật với chính email của mình thì không bị coi là trùng.
        $this->putJson("/api/users/{$nguoiDung->id}", ['email' => 'moi@example.com'])->assertOk();

        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'users',
            'doi_tuong_id' => $nguoiDung->id,
            'hanh_dong' => 'CAP_NHAT',
        ]);
    }

    public function test_khoa_tai_khoan_thu_hoi_toan_bo_token(): void
    {
        $nguoiDung = User::factory()->sinhVien()->create();
        $nguoiDung->createToken('thiet-bi-1');
        $nguoiDung->createToken('thiet-bi-2');
        $this->assertDatabaseCount('personal_access_tokens', 2);

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson("/api/users/{$nguoiDung->id}/status", ['trang_thai' => false])
            ->assertOk()
            ->assertJsonPath('data.trang_thai', false);

        // BR-30: token 7 ngày còn hiệu lực thì việc khóa là vô nghĩa.
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'users',
            'doi_tuong_id' => $nguoiDung->id,
            'hanh_dong' => 'KHOA',
        ]);

        // Token đã thu hồi không dùng được nữa.
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $nguoiDung->id]);
    }

    public function test_khong_khoa_duoc_tai_khoan_cua_chinh_minh(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $this->patchJson("/api/users/{$this->admin->id}/status", ['trang_thai' => false])
            ->assertForbidden()
            ->assertJsonPath('ma_loi', 'FORBIDDEN');

        $this->assertTrue($this->admin->fresh()->trang_thai);
    }

    public function test_bulk_status_xu_ly_tung_dong_doc_lap(): void
    {
        $a = User::factory()->sinhVien()->create(['trang_thai' => true]);
        $b = User::factory()->sinhVien()->create(['trang_thai' => true]);
        $a->createToken('thiet-bi');

        $this->actingAs($this->admin, 'sanctum')
            ->patchJson('/api/users/bulk-status', [
                'ids' => [$a->id, $b->id, 999999, $this->admin->id],
                'trang_thai' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.thanh_cong', 2)
            ->assertJsonPath('data.that_bai', 2)
            ->assertJsonPath('data.chi_tiet.2.ma_loi', 'NOT_FOUND')
            ->assertJsonPath('data.chi_tiet.3.ma_loi', 'FORBIDDEN');

        $this->assertFalse($a->fresh()->trang_thai);
        $this->assertFalse($b->fresh()->trang_thai);
        $this->assertTrue($this->admin->fresh()->trang_thai);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_dat_lai_mat_khau_tra_mat_khau_moi_va_thu_hoi_token(): void
    {
        $nguoiDung = User::factory()->sinhVien()->create();
        $nguoiDung->createToken('thiet-bi');
        $matKhauCu = $nguoiDung->password;

        $phanHoi = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/users/{$nguoiDung->id}/reset-password")
            ->assertOk()
            ->assertJsonPath('data.must_change_password', true);

        $matKhauMoi = $phanHoi->json('data.mat_khau_moi');
        $this->assertIsString($matKhauMoi);

        $nguoiDung->refresh();
        $this->assertTrue(Hash::check($matKhauMoi, $nguoiDung->password));
        $this->assertFalse(Hash::check('password', $nguoiDung->password) && $matKhauCu === $nguoiDung->password);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_xoa_chi_ap_dung_cho_tai_khoan_admin(): void
    {
        $adminKhac = User::factory()->admin()->create();
        $sinhVien = User::factory()->sinhVien()->create();

        $this->actingAs($this->admin, 'sanctum');

        $this->deleteJson("/api/users/{$sinhVien->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/users/{$this->admin->id}")
            ->assertConflict()
            ->assertJsonPath('ma_loi', 'DELETE_BLOCKED');

        $this->deleteJson("/api/users/{$adminKhac->id}")->assertOk();

        $this->assertSoftDeleted('users', [
            'id' => $adminKhac->id,
            'deleted_by' => $this->admin->id,
        ]);
        $this->assertDatabaseHas('nhat_ky', [
            'doi_tuong_loai' => 'users',
            'doi_tuong_id' => $adminKhac->id,
            'hanh_dong' => 'XOA',
        ]);
    }

    public function test_chi_admin_vao_duoc_nhom_nguoi_dung(): void
    {
        $giangVien = User::factory()->giangVien()->create(['must_change_password' => false]);
        $sinhVien = User::factory()->sinhVien()->create(['must_change_password' => false]);

        $this->actingAs($giangVien, 'sanctum')->getJson('/api/users')->assertForbidden();
        $this->actingAs($sinhVien, 'sanctum')->getJson('/api/users')->assertForbidden();
        $this->actingAs($sinhVien, 'sanctum')
            ->patchJson('/api/users/bulk-status', ['ids' => [$giangVien->id], 'trang_thai' => false])
            ->assertForbidden();
        $this->actingAs($this->admin, 'sanctum')->getJson('/api/users')->assertOk();
    }

    public function test_put_me_sua_duoc_dung_truong_theo_vai_tro(): void
    {
        // ADMIN: name + email trên users
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/me', ['name' => 'Quản trị mới', 'email' => 'adminmoi@example.com'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Quản trị mới')
            ->assertJsonPath('data.email', 'adminmoi@example.com');

        // GIẢNG VIÊN: số điện thoại trên hồ sơ giảng viên, không sửa được tên tài khoản
        $taiKhoanGv = User::factory()->giangVien()->create(['must_change_password' => false]);
        $giangVien = GiangVien::factory()->create(['user_id' => $taiKhoanGv->id]);
        $tenCu = $taiKhoanGv->name;

        $this->actingAs($taiKhoanGv, 'sanctum')
            ->putJson('/api/me', ['so_dien_thoai' => '0901234567', 'name' => 'Tên bị bỏ qua'])
            ->assertOk();

        $this->assertSame('0901234567', $giangVien->fresh()->so_dien_thoai);
        $this->assertSame($tenCu, $taiKhoanGv->fresh()->name);

        // SINH VIÊN: số điện thoại + địa chỉ trên hồ sơ sinh viên
        $taiKhoanSv = User::factory()->sinhVien()->create(['must_change_password' => false]);
        $sinhVien = SinhVien::factory()->create(['user_id' => $taiKhoanSv->id]);

        $this->actingAs($taiKhoanSv, 'sanctum')
            ->putJson('/api/me', ['so_dien_thoai' => '0912345678', 'dia_chi' => 'Hà Nội'])
            ->assertOk();

        $sinhVien->refresh();
        $this->assertSame('0912345678', $sinhVien->so_dien_thoai);
        $this->assertSame('Hà Nội', $sinhVien->dia_chi);
    }

    public function test_put_me_chan_email_trung(): void
    {
        User::factory()->create(['email' => 'dadung@example.com']);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/me', ['email' => 'dadung@example.com'])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }
}
