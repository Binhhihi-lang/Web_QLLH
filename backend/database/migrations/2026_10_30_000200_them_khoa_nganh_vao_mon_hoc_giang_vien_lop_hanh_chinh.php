<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Gắn Khoa/Ngành vào môn học, giảng viên và lớp hành chính (ADR-020).
 *
 * Ba việc, theo thứ tự bắt buộc:
 *  1. Thêm cột FK mới.
 *  2. Chuyển dữ liệu cũ sang FK — `giang_vien.chuyen_mon` chứa TÊN ngành,
 *     `lop_hanh_chinh.nganh` chứa MÃ ngành, cả hai đều trỏ về bảng `nganh`.
 *     Phải chuyển xong mới được xóa cột, nếu không là mất dữ liệu.
 *  3. Xóa hai cột cũ.
 *
 * Bước 2 **chỉ tạo danh mục khi thật sự có dữ liệu cũ cần chuyển**. CSDL mới tinh
 * không có gì để chuyển nên danh mục để trống — `KhoaNganhSeeder` mới là nơi khai
 * danh mục, đúng như các danh mục khác của dự án. Nhờ vậy migration không tự sinh
 * dữ liệu nghiệp vụ trên môi trường mới.
 */
return new class extends Migration
{
    private const KHOA = ['CNTT', 'Công nghệ thông tin'];

    private const TEN_THEO_MA = [
        'KTPM' => 'Công nghệ phần mềm',
        'HTTT' => 'Hệ thống thông tin',
        'KHMT' => 'Khoa học máy tính',
        'MTTT' => 'Mạng và truyền thông',
        'ATTT' => 'An toàn thông tin',
    ];

    public function up(): void
    {
        Schema::table('mon_hoc', function (Blueprint $table) {
            $table->foreignId('khoa_id')->nullable()->after('ma_mon')
                ->constrained('khoa')->nullOnDelete();
        });

        Schema::table('giang_vien', function (Blueprint $table) {
            $table->foreignId('nganh_id')->nullable()->after('so_dien_thoai')
                ->constrained('nganh')->nullOnDelete();
        });

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->foreignId('nganh_id')->nullable()->after('khoa_hoc')
                ->constrained('nganh')->nullOnDelete();
        });

        $this->chuyenDuLieuCuSangNganh();

        Schema::table('giang_vien', function (Blueprint $table) {
            $table->dropColumn('chuyen_mon');
        });

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            // Phải bỏ index trước: SQLite từ chối DROP COLUMN khi còn index trỏ tới nó.
            $table->dropIndex(['nganh']);
            $table->dropColumn('nganh');
        });
    }

    public function down(): void
    {
        Schema::table('giang_vien', function (Blueprint $table) {
            $table->string('chuyen_mon')->nullable()->after('so_dien_thoai');
        });

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->string('nganh', 20)->nullable()->after('khoa_hoc');
            $table->index('nganh');
        });

        // Trả lại từ vựng cũ để `down()` không mất thông tin.
        $this->hoanDuLieuVeChuoi();

        Schema::table('lop_hanh_chinh', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nganh_id');
        });

        Schema::table('giang_vien', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nganh_id');
        });

        Schema::table('mon_hoc', function (Blueprint $table) {
            $table->dropConstrainedForeignId('khoa_id');
        });
    }

    private function chuyenDuLieuCuSangNganh(): void
    {
        $tenNganhCu = DB::table('giang_vien')->whereNotNull('chuyen_mon')
            ->distinct()->pluck('chuyen_mon')->all();

        $maNganhCu = DB::table('lop_hanh_chinh')->whereNotNull('nganh')
            ->distinct()->pluck('nganh')->all();

        if ($tenNganhCu === [] && $maNganhCu === []) {
            return;
        }

        $bayGio = now();

        DB::table('khoa')->insertOrIgnore([
            'ma_khoa' => self::KHOA[0],
            'ten_khoa' => self::KHOA[1],
            'mo_ta' => null,
            'trang_thai' => true,
            'created_at' => $bayGio,
            'updated_at' => $bayGio,
        ]);

        $khoaId = DB::table('khoa')->where('ma_khoa', self::KHOA[0])->value('id');

        // Tập ngành cần có: tên cũ giữ nguyên; mã cũ quy về tên chuẩn nếu biết.
        $tenCanCo = array_values(array_unique(array_filter(array_merge(
            $tenNganhCu,
            array_map(fn(string $ma) => self::TEN_THEO_MA[$ma] ?? null, $maNganhCu),
        ))));

        $maDaDung = DB::table('nganh')->pluck('ma_nganh')->all();
        $rows = [];

        foreach ($tenCanCo as $ten) {
            $ma = $this->maChuanCho($ten, $maDaDung);
            $maDaDung[] = $ma;

            $rows[] = [
                'khoa_id' => $khoaId,
                'ma_nganh' => $ma,
                'ten_nganh' => $ten,
                'mo_ta' => null,
                'trang_thai' => true,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];
        }

        if ($rows !== []) {
            DB::table('nganh')->insertOrIgnore($rows);
        }

        $idTheoMa = DB::table('nganh')->pluck('id', 'ma_nganh');
        $idTheoTen = DB::table('nganh')->pluck('id', 'ten_nganh');

        // Giảng viên: `chuyen_mon` cũ chứa TÊN ngành.
        DB::table('giang_vien')
            ->select('id', 'chuyen_mon')
            ->whereNotNull('chuyen_mon')
            ->orderBy('id')
            ->chunk(200, function ($giangViens) use ($idTheoTen) {
                foreach ($giangViens as $giangVien) {
                    $nganhId = $idTheoTen[$giangVien->chuyen_mon] ?? null;

                    if ($nganhId !== null) {
                        DB::table('giang_vien')->where('id', $giangVien->id)
                            ->update(['nganh_id' => $nganhId]);
                    }
                }
            });

        // Lớp hành chính: `nganh` cũ chứa MÃ ngành. 'CNTT' không map — đó là khoa,
        // không phải ngành; lớp nào chỉ ghi 'CNTT' thì để trống ngành.
        DB::table('lop_hanh_chinh')
            ->select('id', 'nganh')
            ->whereNotNull('nganh')
            ->orderBy('id')
            ->chunk(200, function ($lops) use ($idTheoTen) {
                foreach ($lops as $lop) {
                    $tenChuan = self::TEN_THEO_MA[$lop->nganh] ?? null;
                    $nganhId = $tenChuan === null ? null : ($idTheoTen[$tenChuan] ?? null);

                    if ($nganhId !== null) {
                        DB::table('lop_hanh_chinh')->where('id', $lop->id)
                            ->update(['nganh_id' => $nganhId]);
                    }
                }
            });
    }

    /**
     * Mã ngành chuẩn nếu tên nằm trong bảng chuẩn; nếu là tên do người dùng tự
     * nhập thì lấy chữ đầu các từ ("Công nghệ phần mềm" → "CNPM"), thêm hậu tố
     * nếu mã đó đã dùng.
     *
     * @param  array<int, string>  $maDaDung
     */
    private function maChuanCho(string $tenNganh, array $maDaDung): string
    {
        $maChuan = array_search($tenNganh, self::TEN_THEO_MA, true);

        if ($maChuan !== false) {
            return $maChuan;
        }

        $ma = '';
        foreach (preg_split('/\s+/u', trim($tenNganh)) ?: [] as $tu) {
            $ma .= mb_strtoupper(mb_substr($tu, 0, 1));
        }

        $ma = mb_substr($ma, 0, 20) ?: 'NG';
        $goc = $ma;
        $thuTu = 2;

        while (in_array($ma, $maDaDung, true)) {
            $ma = mb_substr($goc, 0, 17) . '-' . $thuTu;
            $thuTu++;
        }

        return $ma;
    }

    private function hoanDuLieuVeChuoi(): void
    {
        $maTheoId = DB::table('nganh')->pluck('ma_nganh', 'id');
        $tenTheoId = DB::table('nganh')->pluck('ten_nganh', 'id');

        DB::table('giang_vien')->select('id', 'nganh_id')->whereNotNull('nganh_id')
            ->orderBy('id')
            ->chunk(200, function ($giangViens) use ($tenTheoId) {
                foreach ($giangViens as $giangVien) {
                    DB::table('giang_vien')->where('id', $giangVien->id)
                        ->update(['chuyen_mon' => $tenTheoId[$giangVien->nganh_id] ?? null]);
                }
            });

        DB::table('lop_hanh_chinh')->select('id', 'nganh_id')->whereNotNull('nganh_id')
            ->orderBy('id')
            ->chunk(200, function ($lops) use ($maTheoId) {
                foreach ($lops as $lop) {
                    DB::table('lop_hanh_chinh')->where('id', $lop->id)
                        ->update(['nganh' => $maTheoId[$lop->nganh_id] ?? null]);
                }
            });
    }
};
