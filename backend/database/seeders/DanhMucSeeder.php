<?php

namespace Database\Seeders;

use App\Models\HocKy;
use App\Models\Khoa;
use App\Models\LopHanhChinh;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\PhongHoc;
use Illuminate\Database\Seeder;

class DanhMucSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedLopHanhChinh();
        $this->seedMonHoc();
        $this->seedHocKy();
        $this->seedPhongHoc();
    }

    private function seedLopHanhChinh(): void
    {
        if (LopHanhChinh::query()->exists()) {
            return;
        }

        // Dùng mã ngành thật để mã lớp và ngành khớp nhau; trước đây danh sách này
        // có cả 'CNTT' — vốn là khoa chứ không phải ngành (ADR-020).
        $nganh = ['KTPM', 'HTTT', 'KHMT', 'MTTT', 'ATTT'];
        $idTheoMa = Nganh::query()->pluck('id', 'ma_nganh');
        $rows = [];

        for ($i = 1; $i <= 20; $i++) {
            $khoaHoc = 'K'.(63 + intdiv($i, 5));
            $nganhCuaLop = $nganh[($i - 1) % count($nganh)];
            $ma = sprintf('%s-%s%02d', $nganhCuaLop, $khoaHoc, $i);
            $rows[] = [
                'ma_lop' => $ma,
                'ten_lop' => 'Lớp '.$ma,
                'khoa_hoc' => $khoaHoc,
                'nganh_id' => $idTheoMa[$nganhCuaLop] ?? null,
                // K63 nhập học 2021, K64 → 2022, ...
                'nam_nhap_hoc' => 2000 + (int) substr($khoaHoc, 1) - 42,
                'mo_ta' => null,
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        LopHanhChinh::query()->insert($rows);
    }

    private function seedMonHoc(): void
    {
        if (MonHoc::query()->exists()) {
            return;
        }

        $tenMon = [
            'Lập trình cơ bản', 'Lập trình hướng đối tượng', 'Cấu trúc dữ liệu và giải thuật',
            'Cơ sở dữ liệu', 'Hệ quản trị cơ sở dữ liệu', 'Mạng máy tính', 'Hệ điều hành',
            'Phân tích thiết kế hệ thống', 'Lập trình web', 'Lập trình di động',
            'Trí tuệ nhân tạo', 'Học máy', 'Khai phá dữ liệu', 'An toàn thông tin',
            'Mật mã học', 'Kiến trúc máy tính', 'Toán rời rạc', 'Xác suất thống kê',
            'Quản lý dự án phần mềm', 'Kiểm thử phần mềm', 'Thiết kế giao diện người dùng',
            'Điện toán đám mây', 'Phát triển ứng dụng di động', 'Kỹ thuật lập trình',
            'Nhập môn công nghệ phần mềm', 'Đồ án chuyên ngành', 'Thực tập tốt nghiệp',
            'Tiếng Anh chuyên ngành', 'Kinh tế học đại cương', 'Pháp luật đại cương',
        ];

        $khoaId = Khoa::query()->where('ma_khoa', 'CNTT')->value('id');
        $rows = [];
        foreach ($tenMon as $i => $ten) {
            $rows[] = [
                'ma_mon' => sprintf('MH%03d', $i + 1),
                // Toàn bộ môn trong dữ liệu mẫu thuộc khoa CNTT — đây là khoa duy nhất được seed.
                'khoa_id' => $khoaId,
                'ten_mon' => $ten,
                'so_tin_chi' => $i % 5 === 0 ? 4 : ($i % 3 === 0 ? 2 : 3),
                'mo_ta' => null,
                'trang_thai' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        MonHoc::query()->insert($rows);
    }

    private function seedHocKy(): void
    {
        if (HocKy::query()->exists()) {
            return;
        }

        HocKy::query()->insert([
            [
                'ma_hoc_ky' => '2025-2',
                'ten_hoc_ky' => 'Học kỳ 2 năm học 2025-2026',
                'nam_hoc' => '2025-2026',
                'ky_thu' => 2,
                'ngay_bat_dau' => '2026-01-05',
                'ngay_ket_thuc' => '2026-05-15',
                'mo_dang_ky_luc' => '2025-12-15 08:00:00',
                'dong_dang_ky_luc' => '2026-01-02 17:00:00',
                'trang_thai' => HocKy::CLOSED,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ma_hoc_ky' => '2026-1',
                'ten_hoc_ky' => 'Học kỳ 1 năm học 2026-2027',
                'nam_hoc' => '2026-2027',
                'ky_thu' => 1,
                'ngay_bat_dau' => '2026-09-07',
                'ngay_ket_thuc' => '2027-01-16',
                'mo_dang_ky_luc' => '2026-08-10 08:00:00',
                'dong_dang_ky_luc' => '2026-09-05 17:00:00',
                'trang_thai' => HocKy::ONGOING,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ma_hoc_ky' => '2026-2',
                'ten_hoc_ky' => 'Học kỳ 2 năm học 2026-2027',
                'nam_hoc' => '2026-2027',
                'ky_thu' => 2,
                'ngay_bat_dau' => '2027-01-25',
                'ngay_ket_thuc' => '2027-05-28',
                // Đợt đăng ký mở sẵn để demo luồng đăng ký (học kỳ vẫn UPCOMING):
                // chỉ có lớp mới nhận đăng ký thật, và chỉ trong khung này.
                'mo_dang_ky_luc' => '2026-11-01 08:00:00',
                'dong_dang_ky_luc' => '2026-12-31 17:00:00',
                'trang_thai' => HocKy::UPCOMING,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    private function seedPhongHoc(): void
    {
        if (PhongHoc::query()->exists()) {
            return;
        }

        $rows = [];
        $toa = ['A', 'B', 'C'];
        $so = 1;

        foreach ($toa as $t) {
            for ($tang = 1; $tang <= 4; $tang++) {
                for ($phong = 1; $phong <= 2; $phong++, $so++) {
                    $ma = sprintf('%s%d%02d', $t, $tang, $phong);
                    $rows[] = [
                        'ma_phong' => $ma,
                        'ten_phong' => 'Phòng '.$ma,
                        'suc_chua' => $tang === 1 ? 100 : 50,
                        'trang_thai' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // 24 phòng ở trên, thêm 1 hội trường cho đủ 25.
        $rows[] = [
            'ma_phong' => 'HT01',
            'ten_phong' => 'Hội trường A',
            'suc_chua' => 200,
            'trang_thai' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        PhongHoc::query()->insert($rows);
    }
}
