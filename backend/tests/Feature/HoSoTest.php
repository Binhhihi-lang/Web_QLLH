<?php

namespace Tests\Feature;

use App\Exceptions\LoiNghiepVu;
use App\Models\GiangVien;
use App\Models\SinhVien;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class HoSoTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create(['must_change_password' => false]);
    }

    public function test_xem_thong_tin_ca_nhan_get_auth_me(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $userSv = $sinhVien->user;
        $userSv->update(['must_change_password' => false]);

        $response = $this->actingAs($userSv, 'sanctum')
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $userSv->id)
            ->assertJsonPath('data.email', $userSv->email)
            ->assertJsonPath('data.vai_tro', User::SINH_VIEN)
            ->assertJsonPath('data.ho_so.loai', 'sinh_vien')
            ->assertJsonPath('data.ho_so.ma_sv', $sinhVien->ma_sv);
    }

    public function test_admin_cap_nhat_ho_so_ten_va_email(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/me', [
                'name' => 'Nguyễn Quản Trị Viên',
                'email' => 'admin_moi@example.com',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Nguyễn Quản Trị Viên')
            ->assertJsonPath('data.email', 'admin_moi@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $this->admin->id,
            'name' => 'Nguyễn Quản Trị Viên',
            'email' => 'admin_moi@example.com',
        ]);
    }

    public function test_giang_vien_cap_nhat_so_dien_thoai(): void
    {
        $giangVien = GiangVien::factory()->create();
        $userGv = $giangVien->user;
        $userGv->update(['must_change_password' => false]);
        $tenCu = $userGv->name;

        $response = $this->actingAs($userGv, 'sanctum')
            ->putJson('/api/me', [
                'so_dien_thoai' => '0988776655',
                'name' => 'Tên không được sửa',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('0988776655', $giangVien->fresh()->so_dien_thoai);
        $this->assertEquals($tenCu, $userGv->fresh()->name);
    }

    public function test_sinh_vien_cap_nhat_so_dien_thoai_va_dia_chi(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $userSv = $sinhVien->user;
        $userSv->update(['must_change_password' => false]);

        $response = $this->actingAs($userSv, 'sanctum')
            ->putJson('/api/me', [
                'so_dien_thoai' => '0912345678',
                'dia_chi' => '123 Đường Cầu Giấy, Hà Nội',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('0912345678', $sinhVien->fresh()->so_dien_thoai);
        $this->assertEquals('123 Đường Cầu Giấy, Hà Nội', $sinhVien->fresh()->dia_chi);
    }

    public function test_cap_nhat_ho_so_chan_email_trung(): void
    {
        User::factory()->create(['email' => 'da_ton_tai@example.com']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/me', [
                'email' => 'da_ton_tai@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_tai_anh_dai_dien_thanh_cong(): void
    {
        $fakeUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567/qllh/avatars/user_1.jpg';
        $fakePublicId = 'qllh/avatars/user_1_abc123';

        $this->mock(CloudinaryService::class, function ($mock) use ($fakeUrl, $fakePublicId) {
            $mock->shouldReceive('uploadAvatar')
                ->once()
                ->andReturn([
                    'url' => $fakeUrl,
                    'public_id' => $fakePublicId,
                ]);
        });

        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/me/avatar', [
                'anh' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Cập nhật ảnh đại diện thành công.')
            ->assertJsonPath('data.avatar_url', $fakeUrl);

        $this->assertDatabaseHas('users', [
            'id' => $this->admin->id,
            'avatar_url' => $fakeUrl,
            'avatar_public_id' => $fakePublicId,
        ]);
    }

    public function test_tai_anh_dai_dien_thay_the_anh_cu_thi_xoa_anh_cu(): void
    {
        $oldPublicId = 'qllh/avatars/user_1_old';
        $this->admin->update([
            'avatar_url' => 'https://res.cloudinary.com/demo/image/upload/old.jpg',
            'avatar_public_id' => $oldPublicId,
        ]);

        $newUrl = 'https://res.cloudinary.com/demo/image/upload/new.jpg';
        $newPublicId = 'qllh/avatars/user_1_new';

        $this->mock(CloudinaryService::class, function ($mock) use ($oldPublicId, $newUrl, $newPublicId) {
            $mock->shouldReceive('uploadAvatar')
                ->once()
                ->andReturn([
                    'url' => $newUrl,
                    'public_id' => $newPublicId,
                ]);

            $mock->shouldReceive('xoaAvatar')
                ->once()
                ->with($oldPublicId);
        });

        $file = UploadedFile::fake()->create('new_avatar.png', 100, 'image/png');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/me/avatar', [
                'anh' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.avatar_url', $newUrl);

        $this->assertEquals($newPublicId, $this->admin->fresh()->avatar_public_id);
    }

    public function test_tai_anh_dai_dien_chan_file_khong_phai_anh(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/me/avatar', [
                'anh' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_xoa_anh_dai_dien_thanh_cong(): void
    {
        $publicId = 'qllh/avatars/user_to_delete';
        $this->admin->update([
            'avatar_url' => 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
            'avatar_public_id' => $publicId,
        ]);

        $this->mock(CloudinaryService::class, function ($mock) use ($publicId) {
            $mock->shouldReceive('xoaAvatar')
                ->once()
                ->with($publicId);
        });

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/me/avatar');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Đã gỡ ảnh đại diện.')
            ->assertJsonPath('data.avatar_url', null);

        $this->assertDatabaseHas('users', [
            'id' => $this->admin->id,
            'avatar_url' => null,
            'avatar_public_id' => null,
        ]);
    }

    public function test_tai_anh_dai_dien_tra_503_khi_chua_cau_hinh_cloudinary(): void
    {
        $this->mock(CloudinaryService::class, function ($mock) {
            $mock->shouldReceive('uploadAvatar')
                ->once()
                ->andThrow(new LoiNghiepVu('UPLOAD_NOT_CONFIGURED', 'Chức năng tải ảnh chưa được cấu hình trên máy chủ.', 503));
        });

        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/me/avatar', [
                'anh' => $file,
            ]);

        $response->assertStatus(503)
            ->assertJsonPath('ma_loi', 'UPLOAD_NOT_CONFIGURED');
    }

    public function test_tai_anh_dai_dien_tra_502_khi_cloudinary_upload_that_bai(): void
    {
        $this->mock(CloudinaryService::class, function ($mock) {
            $mock->shouldReceive('uploadAvatar')
                ->once()
                ->andThrow(new LoiNghiepVu('UPLOAD_FAILED', 'Tải ảnh lên thất bại, vui lòng thử lại.', 502));
        });

        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/me/avatar', [
                'anh' => $file,
            ]);

        $response->assertStatus(502)
            ->assertJsonPath('ma_loi', 'UPLOAD_FAILED');
    }
}
