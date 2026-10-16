<?php

namespace Tests\Feature;

use App\Models\LopHoc;
use App\Models\Menu;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test tạm để kiểm chứng các chức năng vừa thêm. Có thể xóa sau khi nghiệm thu.
 */
class KiemChungTinhNangTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Cố định đồng hồ trong giờ hành chính (8h-17h) để middleware
        // gio.hanh.chinh không chặn test khi chạy ngoài giờ.
        $this->travelTo(\Carbon\Carbon::parse('2026-10-16 10:00:00'));
    }

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    private function giangVien(): User
    {
        return User::factory()->giangVien()->create();
    }

    // ---------- Đăng nhập ----------

    public function test_khach_chua_dang_nhap_bi_day_ve_trang_login(): void
    {
        $this->get('/lophoc')->assertRedirect(route('login'));
        $this->get('/nguoi-dung')->assertRedirect(route('login'));
    }

    public function test_dang_nhap_thanh_cong_va_that_bai(): void
    {
        $user = User::factory()->admin()->create(['password' => 'password']);

        $this->post(route('login.attempt'), [
            'email' => $user->email,
            'password' => 'sai-mat-khau',
        ])->assertSessionHasErrors('email');

        $this->post(route('login.attempt'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('lophoc.index'));

        $this->assertAuthenticatedAs($user);
    }

    public function test_tai_khoan_bi_khoa_khong_dang_nhap_duoc(): void
    {
        $user = User::factory()->giangVien()->biKhoa()->create(['password' => 'password']);

        $this->post(route('login.attempt'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_dang_xuat(): void
    {
        $this->actingAs($this->admin())
            ->post(route('logout'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    }

    // ---------- Phân quyền ----------

    public function test_giang_vien_vao_duoc_lop_hoc_va_sinh_vien(): void
    {
        $gv = $this->giangVien();

        $this->actingAs($gv)->get('/lophoc')->assertOk();
        $this->actingAs($gv)->get('/sinhvien')->assertOk();
        $this->actingAs($gv)->get('/tai-khoan')->assertOk();
    }

    public function test_giang_vien_bi_chan_khoi_menu_va_nguoi_dung(): void
    {
        $gv = $this->giangVien();

        $this->actingAs($gv)->get('/menu')->assertForbidden();
        $this->actingAs($gv)->get('/nguoi-dung')->assertForbidden();
    }

    public function test_admin_vao_duoc_tat_ca(): void
    {
        $admin = $this->admin();

        foreach (['/lophoc', '/sinhvien', '/menu', '/nguoi-dung', '/tai-khoan'] as $duongDan) {
            $this->actingAs($admin)->get($duongDan)->assertOk();
        }
    }

    public function test_giang_vien_khong_tu_doi_duoc_vai_tro_qua_form_tai_khoan(): void
    {
        $gv = $this->giangVien();

        $this->actingAs($gv)->put(route('taikhoan.update'), [
            'name' => 'Tên mới',
            'email' => $gv->email,
            'vai_tro' => User::ADMIN,
        ])->assertRedirect(route('taikhoan.edit'));

        $this->assertSame(User::GIANG_VIEN, $gv->fresh()->vai_tro);
        $this->assertSame('Tên mới', $gv->fresh()->name);
    }

    public function test_doi_mat_khau_can_dung_mat_khau_hien_tai(): void
    {
        $gv = User::factory()->giangVien()->create(['password' => 'password']);

        $this->actingAs($gv)->put(route('taikhoan.update'), [
            'name' => $gv->name,
            'email' => $gv->email,
            'mat_khau_hien_tai' => 'sai',
            'password' => 'matkhaumoi',
            'password_confirmation' => 'matkhaumoi',
        ])->assertSessionHasErrors('mat_khau_hien_tai');

        $this->actingAs($gv)->put(route('taikhoan.update'), [
            'name' => $gv->name,
            'email' => $gv->email,
            'mat_khau_hien_tai' => 'password',
            'password' => 'matkhaumoi',
            'password_confirmation' => 'matkhaumoi',
        ])->assertRedirect(route('taikhoan.edit'));

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('matkhaumoi', $gv->fresh()->password));
    }

    // ---------- Quản lý người dùng ----------

    public function test_them_nguoi_dung_moi_qua_form(): void
    {
        $this->actingAs($this->admin())->post(route('nguoidung.store'), [
            'name' => 'Người mới',
            'email' => 'moi@example.com',
            'vai_tro' => User::GIANG_VIEN,
            'trang_thai' => '1',
            'password' => 'matkhau123',
            'password_confirmation' => 'matkhau123',
        ])->assertRedirect(route('nguoidung.index'));

        $this->assertDatabaseHas('users', ['email' => 'moi@example.com', 'vai_tro' => User::GIANG_VIEN]);
    }

    public function test_them_nguoi_dung_thieu_du_lieu_bao_loi(): void
    {
        $this->actingAs($this->admin())->post(route('nguoidung.store'), [])
            ->assertSessionHasErrors(['name', 'email', 'vai_tro', 'password']);
    }

    public function test_sua_nguoi_dung_de_trong_mat_khau_thi_giu_nguyen(): void
    {
        $admin = $this->admin();
        $target = User::factory()->giangVien()->create(['password' => 'password']);
        $hashCu = $target->password;

        $this->actingAs($admin)->put(route('nguoidung.update', $target->id), [
            'name' => 'Đã đổi tên',
            'email' => $target->email,
            'vai_tro' => User::GIANG_VIEN,
            'trang_thai' => '1',
            'password' => '',
        ])->assertRedirect(route('nguoidung.index'));

        $target->refresh();
        $this->assertSame('Đã đổi tên', $target->name);
        $this->assertSame($hashCu, $target->password);
    }

    public function test_khong_tu_xoa_duoc_tai_khoan_dang_dang_nhap(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->delete(route('nguoidung.destroy', $admin->id))
            ->assertSessionHasErrors('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    // ---------- Menu động ----------

    public function test_sidebar_chi_hien_menu_phu_hop_vai_tro(): void
    {
        Menu::factory()->create(['ten' => 'Mục chung', 'url' => '/lophoc', 'vi_tri' => 'sidebar', 'vai_tro' => null]);
        Menu::factory()->create(['ten' => 'Mục của admin', 'url' => '/nguoi-dung', 'vi_tri' => 'sidebar', 'vai_tro' => 'admin']);
        Menu::factory()->create(['ten' => 'Mục đã ẩn', 'url' => '/an', 'vi_tri' => 'sidebar', 'trang_thai' => false]);

        // Giảng viên: thấy mục chung, không thấy mục của admin, không thấy mục đã ẩn.
        $this->actingAs($this->giangVien())->get('/lophoc')
            ->assertSee('Mục chung')
            ->assertDontSee('Mục của admin')
            ->assertDontSee('Mục đã ẩn');

        // Admin: thấy cả mục chung lẫn mục của admin.
        $this->actingAs($this->admin())->get('/lophoc')
            ->assertSee('Mục chung')
            ->assertSee('Mục của admin');
    }

    public function test_menu_dang_xem_duoc_to_sang(): void
    {
        Menu::factory()->create(['ten' => 'Lớp học', 'url' => '/lophoc', 'vi_tri' => 'sidebar', 'vai_tro' => null]);

        $this->actingAs($this->admin())->get('/lophoc')
            ->assertSee('class="active"', false);
    }

    // ---------- CRUD web ----------

    public function test_them_lop_hoc_voi_validate(): void
    {
        $admin = $this->admin();

        // Thiếu dữ liệu -> lỗi validate.
        $this->actingAs($admin)->post(route('lophoc.store'), [])
            ->assertSessionHasErrors(['ten_lop', 'ma_lop', 'giao_vien', 'si_so']);

        // Mã lớp trùng -> lỗi.
        LopHoc::factory()->create(['ma_lop' => 'LH001']);
        $this->actingAs($admin)->post(route('lophoc.store'), [
            'ten_lop' => 'Lớp A',
            'ma_lop' => 'LH001',
            'giao_vien' => 'GV A',
            'si_so' => 30,
            'trang_thai' => '1',
        ])->assertSessionHasErrors('ma_lop');

        // Hợp lệ -> tạo được.
        $this->actingAs($admin)->post(route('lophoc.store'), [
            'ten_lop' => 'Lớp A',
            'ma_lop' => 'LH999',
            'giao_vien' => 'GV A',
            'si_so' => 30,
            'trang_thai' => '1',
        ])->assertRedirect(route('lophoc.index'));

        $this->assertDatabaseHas('lop_hocs', ['ma_lop' => 'LH999']);
    }

    public function test_sua_lop_hoc_giu_nguyen_ma_lop_cua_chinh_no(): void
    {
        $lop = LopHoc::factory()->create(['ma_lop' => 'LH001']);

        $this->actingAs($this->admin())->put(route('lophoc.update', $lop->id), [
            'ten_lop' => 'Tên đã sửa',
            'ma_lop' => 'LH001',
            'giao_vien' => 'GV B',
            'si_so' => 35,
            'trang_thai' => '1',
        ])->assertRedirect(route('lophoc.index'));

        $this->assertSame('Tên đã sửa', $lop->fresh()->ten_lop);
    }

    public function test_bo_loc_va_sap_xep_lop_hoc(): void
    {
        LopHoc::factory()->create(['ten_lop' => 'Alpha', 'ma_lop' => 'AAA', 'si_so' => 10]);
        LopHoc::factory()->create(['ten_lop' => 'Beta', 'ma_lop' => 'BBB', 'si_so' => 90]);

        // Lọc sĩ số.
        $this->actingAs($this->admin())->get('/lophoc?si_so_min=50')
            ->assertSee('Beta')->assertDontSee('Alpha');

        // Sắp xếp giảm dần theo sĩ số.
        $this->actingAs($this->admin())->get('/lophoc?sort_by=si_so&sort_dir=desc')->assertOk();

        // Bộ lọc sai -> báo lỗi.
        $this->actingAs($this->admin())->get('/lophoc?per_page=999')->assertSessionHasErrors('per_page');
    }

    public function test_them_sinh_vien(): void
    {
        $lop = LopHoc::factory()->create();

        $this->actingAs($this->admin())->post(route('sinhvien.store'), [
            'ma_sv' => 'SV001',
            'ho_ten' => 'Nguyễn Văn A',
            'email' => 'a@example.com',
            'gioi_tinh' => '1',
            'lop_hoc_id' => $lop->id,
            'trang_thai' => '1',
        ])->assertRedirect(route('sinhvien.index'));

        $this->assertDatabaseHas('sinh_viens', ['ma_sv' => 'SV001']);
    }

    public function test_xoa_sinh_vien(): void
    {
        $sv = SinhVien::factory()->create();

        $this->actingAs($this->admin())->delete(route('sinhvien.destroy', $sv->id))
            ->assertRedirect(route('sinhvien.index'));

        $this->assertDatabaseMissing('sinh_viens', ['id' => $sv->id]);
    }

    // ---------- CRUD menu ----------

    public function test_them_menu_kem_vai_tro(): void
    {
        $this->actingAs($this->admin())->post(route('menu.store'), [
            'ten' => 'Quản lý điểm',
            'url' => '/diem',
            'vi_tri' => 'sidebar',
            'nhom' => 'Học vụ',
            'vai_tro' => User::ADMIN,
            'thu_tu' => 7,
            'trang_thai' => '1',
        ])->assertRedirect(route('menu.index'));

        $this->assertDatabaseHas('menus', [
            'url' => '/diem',
            'vai_tro' => User::ADMIN,
        ]);
    }

    public function test_them_menu_de_trong_vai_tro_thi_luu_null(): void
    {
        $this->actingAs($this->admin())->post(route('menu.store'), [
            'ten' => 'Mục chung',
            'url' => '/chung',
            'vi_tri' => 'sidebar',
            'vai_tro' => '',
            'thu_tu' => 1,
            'trang_thai' => '1',
        ])->assertRedirect(route('menu.index'));

        $this->assertNull(Menu::where('url', '/chung')->first()->vai_tro);
    }

    public function test_them_menu_voi_duong_dan_sai_bi_chan(): void
    {
        $this->actingAs($this->admin())->post(route('menu.store'), [
            'ten' => 'Sai',
            'url' => 'khong-co-gach-cheo',
            'vi_tri' => 'sidebar',
            'thu_tu' => 1,
            'trang_thai' => '1',
        ])->assertSessionHasErrors('url');
    }

    public function test_them_menu_voi_vai_tro_khong_hop_le_bi_chan(): void
    {
        $this->actingAs($this->admin())->post(route('menu.store'), [
            'ten' => 'Sai vai tro',
            'url' => '/sai',
            'vi_tri' => 'sidebar',
            'vai_tro' => 'sinh_vien',
            'thu_tu' => 1,
            'trang_thai' => '1',
        ])->assertSessionHasErrors('vai_tro');
    }

    public function test_loc_menu_theo_vai_tro(): void
    {
        Menu::factory()->create(['ten' => 'Của admin', 'vi_tri' => 'sidebar', 'vai_tro' => User::ADMIN]);
        Menu::factory()->create(['ten' => 'Của giảng viên', 'vi_tri' => 'sidebar', 'vai_tro' => User::GIANG_VIEN]);

        $this->actingAs($this->admin())->get('/menu?vai_tro=' . User::ADMIN)
            ->assertSee('Của admin')
            ->assertDontSee('Của giảng viên');
    }

    // ---------- API ----------

    public function test_api_danh_sach_lop_hoc_co_phan_trang(): void
    {
        LopHoc::factory()->count(3)->create();

        $this->getJson('/api/lop-hoc')
            ->assertOk()
            ->assertJsonStructure([
                'success', 'message',
                'data' => [['id', 'ma_lop', 'ten_lop', 'giao_vien', 'so_dien_thoai_gvcn', 'si_so', 'trang_thai', 'so_sinh_vien']],
                'meta' => ['current_page', 'total', 'per_page'],
                'links',
            ])
            ->assertJsonPath('success', true);
    }

    public function test_api_crud_lop_hoc_day_du(): void
    {
        // create
        $taoMoi = $this->postJson('/api/lop-hoc', [
            'ten_lop' => 'Lớp API',
            'ma_lop' => 'API001',
            'giao_vien' => 'GV API',
            'si_so' => 25,
            'trang_thai' => 1,
        ])->assertStatus(201)->assertJsonPath('data.ma_lop', 'API001');

        $id = $taoMoi->json('data.id');

        // read
        $this->getJson("/api/lop-hoc/{$id}")->assertOk()->assertJsonPath('data.ten_lop', 'Lớp API');

        // update
        $this->putJson("/api/lop-hoc/{$id}", [
            'ten_lop' => 'Lớp API đã sửa',
            'ma_lop' => 'API001',
            'giao_vien' => 'GV API',
            'si_so' => 30,
            'trang_thai' => 1,
        ])->assertOk()->assertJsonPath('data.ten_lop', 'Lớp API đã sửa');

        // delete
        $this->deleteJson("/api/lop-hoc/{$id}")->assertOk();
        $this->assertDatabaseMissing('lop_hocs', ['id' => $id]);
    }

    public function test_api_lop_hoc_tra_ve_validate_that_bai_dang_json(): void
    {
        $this->postJson('/api/lop-hoc', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ten_lop', 'ma_lop']);
    }

    public function test_api_crud_sinh_vien_day_du(): void
    {
        $lop = LopHoc::factory()->create();

        $taoMoi = $this->postJson('/api/sinh-vien', [
            'ma_sv' => 'SVAPI001',
            'ho_ten' => 'Sinh Viên API',
            'email' => 'svapi@example.com',
            'gioi_tinh' => 1,
            'lop_hoc_id' => $lop->id,
            'trang_thai' => 1,
        ])->assertStatus(201)->assertJsonPath('data.ma_sv', 'SVAPI001');

        $id = $taoMoi->json('data.id');

        $this->getJson("/api/sinh-vien/{$id}")
            ->assertOk()
            ->assertJsonPath('data.lop_hoc.id', $lop->id);

        $this->putJson("/api/sinh-vien/{$id}", [
            'ma_sv' => 'SVAPI001',
            'ho_ten' => 'Sinh Viên API sửa',
            'email' => 'svapi@example.com',
            'gioi_tinh' => 1,
            'lop_hoc_id' => $lop->id,
            'trang_thai' => 1,
        ])->assertOk()->assertJsonPath('data.ho_ten', 'Sinh Viên API sửa');

        $this->deleteJson("/api/sinh-vien/{$id}")->assertOk();
        $this->assertDatabaseMissing('sinh_viens', ['id' => $id]);
    }

    public function test_api_sinh_vien_loc_va_sap_xep(): void
    {
        $lop = LopHoc::factory()->create(['ten_lop' => 'Lớp Z']);
        SinhVien::factory()->create(['ho_ten' => 'An', 'lop_hoc_id' => $lop->id, 'gioi_tinh' => true]);
        SinhVien::factory()->create(['ho_ten' => 'Bình', 'lop_hoc_id' => $lop->id, 'gioi_tinh' => false]);

        $this->getJson('/api/sinh-vien?sort_by=ho_ten&sort_dir=desc')
            ->assertOk()->assertJsonPath('data.0.ho_ten', 'Bình');

        $this->getJson('/api/sinh-vien?gioi_tinh=1')
            ->assertOk()->assertJsonPath('meta.total', 1);

        // Sắp xếp theo tên lớp (quan hệ).
        $this->getJson('/api/sinh-vien?sort_by=lop_hoc')->assertOk();
    }

    // ---------- Middleware giờ hành chính ----------

    public function test_api_bi_chan_ngoai_gio_hanh_chinh(): void
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-10-16 20:00:00'));

        $this->getJson('/api/lop-hoc')
            ->assertStatus(400)
            ->assertJsonPath('success', false);
    }

    public function test_api_cho_phep_trong_gio_hanh_chinh(): void
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-10-16 09:00:00'));

        $this->getJson('/api/lop-hoc')->assertOk();
    }
}
