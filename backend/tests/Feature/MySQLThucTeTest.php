<?php

namespace Tests\Feature;

use App\Models\BuoiHoc;
use App\Models\CauHinh;
use App\Models\LopHocPhan;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Chỉ chạy trên MySQL thật (phpunit-mysql.xml).
 *
 * Bộ test này nhắm vào những hành vi SQLite in-memory không thể phát hiện:
 * kiểu cột thực, độ dài VARCHAR, ràng buộc FK, kiểu JSON, collation
 * tiếng Việt và các hàm SQL riêng của MySQL.
 */
class MySQLThucTeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Chỉ chạy trên MySQL; dùng phpunit-mysql.xml.');
        }
    }

    private function laMySQL(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }

    public function test_dang_chay_tren_mysql(): void
    {
        $this->assertTrue(
            $this->laMySQL(),
            'Test này chỉ có ý nghĩa trên MySQL; chạy với phpunit-mysql.xml.'
        );
    }

    public function test_cot_so_dien_thoai_la_varchar_20_khong_bi_doi_kieu(): void
    {
        $cot = collect(DB::select(
            'SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
            ['sinh_vien']
        ))->keyBy('COLUMN_NAME');

        // Số điện thoại phải là chuỗi: MySQL sẽ nuốt số 0 đứng đầu nếu là INT.
        $this->assertSame('varchar', $cot['so_dien_thoai']->DATA_TYPE);
        $this->assertEquals(20, $cot['so_dien_thoai']->CHARACTER_MAXIMUM_LENGTH);

        $sinhVien = SinhVien::factory()->create(['so_dien_thoai' => '0912345678']);
        $this->assertSame('0912345678', $sinhVien->fresh()->so_dien_thoai);
    }

    public function test_ma_sv_giu_duoc_so_0_dau(): void
    {
        $sinhVien = SinhVien::factory()->create(['ma_sv' => '01234567']);

        $this->assertSame('01234567', $sinhVien->fresh()->ma_sv);
    }

    public function test_cot_json_that_su_la_json(): void
    {
        CauHinh::create([
            'khoa' => 'thu.json',
            'gia_tri' => ['trong_so' => ['chuyen_can' => 0.25, 'cuoi_ky' => 0.5]],
        ]);

        $kieu = DB::selectOne(
            'SELECT DATA_TYPE FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            ['cau_hinh', 'gia_tri']
        );

        $this->assertSame('json', $kieu->DATA_TYPE);

        // Truy vấn bằng hàm JSON của MySQL, thứ SQLite không có.
        // JSON_UNQUOTE cần thiết: PDO bind 0.5 thành chuỗi, mà so sánh
        // JSON number với JSON string luôn sai.
        $soKhop = DB::selectOne(
            "SELECT COUNT(*) AS so_luong FROM cau_hinh
             WHERE JSON_UNQUOTE(JSON_EXTRACT(gia_tri, '$.trong_so.cuoi_ky')) = ?",
            ['0.5']
        );

        $this->assertEquals(1, $soKhop->so_luong);
    }

    public function test_khoa_ngoai_null_on_delete_khi_xoa_lop_hanh_chinh(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $lopId = $sinhVien->lop_hanh_chinh_id;

        // lop_hanh_chinh_id là nullOnDelete: xoá lớp thì FK về NULL, không chặn.
        DB::table('lop_hanh_chinh')->where('id', $lopId)->delete();

        $this->assertNull($sinhVien->fresh()->lop_hanh_chinh_id);
    }

    public function test_khoa_ngoai_chan_tao_ban_ghi_tro_toi_id_khong_ton_tai(): void
    {
        $sinhVien = SinhVien::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('sinh_vien')->insert([
            'ma_sv' => 'SV-MA-ORPHAN',
            'ho_ten' => 'Mồ côi',
            'email' => 'mocoihan@example.com',
            'user_id' => $sinhVien->user_id,
            'lop_hanh_chinh_id' => 999999,
            'trang_thai' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_cascade_xoa_sinh_vien_khi_xoa_user(): void
    {
        $sinhVien = SinhVien::factory()->create();
        $userId = $sinhVien->user_id;

        DB::table('users')->where('id', $userId)->delete();

        $this->assertSame(0, SinhVien::where('user_id', $userId)->count());
    }

    public function test_strict_mode_tu_choi_chuoi_qua_dai(): void
    {
        // MySQL 8 mặc định STRICT_ALL_TABLES; cắt âm thầm là lỗi dữ liệu.
        $this->assertStringContainsString(
            'STRICT',
            strtoupper((string) DB::selectOne('SELECT @@sql_mode AS m')->m)
        );

        $this->expectException(QueryException::class);

        DB::table('sinh_vien')->insert([
            'ma_sv' => str_repeat('X', 80),
            'ho_ten' => 'Quá dài',
            'email' => 'quaDai@example.com',
            'user_id' => User::factory()->create()->id,
            'trang_thai' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_scope_sap_dien_ra_chay_dung_tren_mysql(): void
    {
        $buoiQuaKhu = BuoiHoc::factory()->create([
            'ngay_hoc' => now()->subDay()->toDateString(),
            'gio_ket_thuc' => '23:59',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $buoiTuongLai = BuoiHoc::factory()->create([
            'ngay_hoc' => now()->addDay()->toDateString(),
            'gio_ket_thuc' => '23:59',
            'trang_thai' => BuoiHoc::SCHEDULED,
        ]);

        $ketQua = BuoiHoc::sapDienRa()->pluck('id')->all();

        $this->assertContains($buoiTuongLai->id, $ketQua);
        $this->assertNotContains($buoiQuaKhu->id, $ketQua);
    }

    public function test_collation_so_sanh_tieng_viet_co_dau(): void
    {
        $collation = DB::selectOne('SELECT @@collation_database AS c')->c;

        // MySQL 8.4 mặc định utf8mb4_0900_ai_ci: so sánh không phân biệt hoa thường.
        $this->assertStringStartsWith('utf8mb4', $collation);

        SinhVien::factory()->create(['ho_ten' => 'Nguyễn Văn An']);

        $this->assertSame(
            1,
            SinhVien::where('ho_ten', 'nguyễn văn an')->count(),
            'Collation utf8mb4_*_ci phải so khớp không phân biệt hoa thường.'
        );
    }

    public function test_laravel_ghi_de_sql_mode_cua_server(): void
    {
        // Server Aiven đặt sql_mode toàn cục có ANSI_QUOTES, nhưng Laravel
        // (config database.strict = true) ghi đè bằng mode riêng cho session.
        // Test này khoá lại hành vi đó để không ai vô tình tắt strict.
        $sqlMode = (string) DB::selectOne('SELECT @@sql_mode AS m')->m;

        $this->assertStringContainsString('STRICT_TRANS_TABLES', $sqlMode);
        $this->assertStringNotContainsString('ANSI_QUOTES', $sqlMode);

        // Nhờ vậy nháy kép vẫn là chuỗi literal trong session của app.
        CauHinh::create(['khoa' => 'thu.json', 'gia_tri' => ['a' => 1]]);

        $this->assertSame(
            1,
            (int) DB::selectOne('SELECT COUNT(*) AS c FROM cau_hinh WHERE khoa = "thu.json"')->c
        );
    }

    public function test_unique_ma_lop_hp_khong_loc_ban_ghi_da_xoa_tren_mysql(): void
    {
        $lop = LopHocPhan::factory()->create(['ma_lop_hp' => 'LHP-MYSQL-UNIQUE']);
        $lop->delete();

        $this->expectException(QueryException::class);

        LopHocPhan::factory()->create([
            'ma_lop_hp' => 'LHP-MYSQL-UNIQUE',
            'hoc_ky_id' => $lop->hoc_ky_id,
        ]);
    }
}
