<?php

namespace Tests\Feature;

use App\Models\GiangVien;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Nghiệm thu Tuần 2: xác thực, phân quyền, must_change_password.
 */
class XacThucTest extends TestCase
{
    use RefreshDatabase;

    public function test_frontend_dev_origins_duoc_phep_preflight_cors(): void
    {
        foreach (['http://localhost:4200', 'http://127.0.0.1:4200'] as $origin) {
            $phanHoi = $this->call('OPTIONS', '/api/auth/login', [], [], [], [
                'HTTP_ORIGIN' => $origin,
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
            ]);

            $phanHoi->assertNoContent()->assertHeader('Access-Control-Allow-Origin', $origin);
        }
    }

    private function taoNguoiDung(string $vaiTro = User::ADMIN, array $thuocTinh = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'admin@example.com',
            'vai_tro' => $vaiTro,
            'password' => Hash::make('password'),
            'must_change_password' => false,
        ], $thuocTinh));
    }

    public function test_dang_nhap_thanh_cong_tra_token_va_nguoi_dung(): void
    {
        $this->taoNguoiDung();

        $phanHoi = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $phanHoi->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nguoi_dung.vai_tro', User::ADMIN)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'het_han_luc',
                    'nguoi_dung' => ['id', 'name', 'email', 'vai_tro', 'must_change_password', 'ho_so'],
                ],
            ]);

        $this->assertNotEmpty($phanHoi->json('data.token'));
    }

    public function test_sinh_vien_dang_nhap_bang_ma_sinh_vien(): void
    {
        $sinhVien = SinhVien::factory()->create(['ma_sv' => 'SV000123']);

        $this->postJson('/api/auth/login', [
            'ma_sv' => $sinhVien->ma_sv,
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('data.nguoi_dung.vai_tro', User::SINH_VIEN);
    }

    public function test_ma_sinh_vien_khong_dang_nhap_duoc_voi_tai_khoan_khac_vai_tro(): void
    {
        $admin = $this->taoNguoiDung();
        SinhVien::factory()->create([
            'ma_sv' => 'SV000123',
            'user_id' => $admin->id,
        ]);

        $this->postJson('/api/auth/login', [
            'ma_sv' => 'SV000123',
            'password' => 'password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('ma_loi', 'AUTH_INVALID');
    }

    public function test_dang_nhap_tu_choi_khi_gui_ca_email_va_ma_sinh_vien(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'ma_sv' => 'SV000123',
            'password' => 'password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR');
    }

    public function test_dang_nhap_sai_mat_khau_tra_401_auth_invalid(): void
    {
        $this->taoNguoiDung();

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'sai-mat-khau',
        ])
            ->assertStatus(401)
            ->assertJsonPath('ma_loi', 'AUTH_INVALID');
    }

    public function test_dang_nhap_email_khong_ton_tai_tra_401(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'khongtontai@example.com',
            'password' => 'password',
        ])
            ->assertStatus(401)
            ->assertJsonPath('ma_loi', 'AUTH_INVALID');
    }

    public function test_tai_khoan_bi_khoa_khong_dang_nhap_duoc(): void
    {
        $this->taoNguoiDung(User::ADMIN, ['trang_thai' => false]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertStatus(403)
            ->assertJsonPath('ma_loi', 'ACCOUNT_LOCKED');
    }

    public function test_dang_nhap_thieu_du_lieu_tra_422(): void
    {
        $this->postJson('/api/auth/login', [])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonStructure(['errors' => ['email', 'password']]);
    }

    public function test_me_tra_ho_so_sinh_vien(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $token = $sinhVien->user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.vai_tro', User::SINH_VIEN)
            ->assertJsonPath('data.ho_so.loai', 'sinh_vien')
            ->assertJsonPath('data.ho_so.ma_sv', $sinhVien->ma_sv);
    }

    public function test_me_tra_ho_so_giang_vien(): void
    {
        $giangVien = GiangVien::factory()->create();
        $token = $giangVien->user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.vai_tro', User::GIANG_VIEN)
            ->assertJsonPath('data.ho_so.loai', 'giang_vien')
            ->assertJsonPath('data.ho_so.ma_gv', $giangVien->ma_gv);
    }

    public function test_admin_khong_co_ho_so(): void
    {
        $admin = $this->taoNguoiDung();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.ho_so', null);
    }

    public function test_dang_xuat_thu_hoi_token(): void
    {
        $admin = $this->taoNguoiDung();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertSame(0, $admin->tokens()->getQuery()->count());

        // Laravel giữ guard đã resolve giữa các request trong cùng test.
        Auth::forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }

    public function test_doi_mat_khau_thanh_cong_va_thu_hoi_token_khac(): void
    {
        $admin = $this->taoNguoiDung();
        $tokenHienTai = $admin->createToken('hien-tai')->plainTextToken;
        $admin->createToken('khac');

        $this->withHeader('Authorization', 'Bearer '.$tokenHienTai)
            ->postJson('/api/auth/change-password', [
                'mat_khau_cu' => 'password',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('matkhaumoi123', $admin->fresh()->password));
        $this->assertSame(1, $admin->tokens()->count());
    }

    public function test_doi_mat_khau_sai_mat_khau_cu_tra_422(): void
    {
        $admin = $this->taoNguoiDung();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/change-password', [
                'mat_khau_cu' => 'sai',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('ma_loi', 'VALIDATION_ERROR')
            ->assertJsonStructure(['errors' => ['mat_khau_cu']]);
    }

    public function test_doi_mat_khau_xac_nhan_khong_khop_tra_422(): void
    {
        $admin = $this->taoNguoiDung();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/change-password', [
                'mat_khau_cu' => 'password',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'khac',
            ])
            ->assertStatus(422);
    }

    public function test_bat_doi_mat_khau_chan_endpoint_khac(): void
    {
        $admin = $this->taoNguoiDung(User::ADMIN, ['must_change_password' => true]);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/options/subjects')
            ->assertStatus(403)
            ->assertJsonPath('ma_loi', 'MUST_CHANGE_PASSWORD');
    }

    public function test_bat_doi_mat_khau_van_goi_duoc_me_va_doi_mat_khau(): void
    {
        $admin = $this->taoNguoiDung(User::ADMIN, ['must_change_password' => true]);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.must_change_password', true);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/change-password', [
                'mat_khau_cu' => 'password',
                'password' => 'matkhaumoi123',
                'password_confirmation' => 'matkhaumoi123',
            ])
            ->assertOk();

        // Sau khi đổi, endpoint khác mở lại.
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/options/subjects')
            ->assertOk();
    }

    public function test_endpoint_options_can_dang_nhap(): void
    {
        $this->getJson('/api/options/subjects')->assertStatus(401);
    }

    public function test_dang_nhap_bi_gioi_han_5_lan_moi_phut(): void
    {
        $this->taoNguoiDung();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'admin@example.com',
                'password' => 'sai',
            ])->assertStatus(401);
        }

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'sai',
        ])
            ->assertStatus(429)
            ->assertJsonPath('ma_loi', 'TOO_MANY_REQUESTS');
    }
}
