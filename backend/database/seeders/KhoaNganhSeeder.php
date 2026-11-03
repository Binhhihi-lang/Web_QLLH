<?php

namespace Database\Seeders;

use App\Models\Khoa;
use App\Models\Nganh;
use Illuminate\Database\Seeder;

/**
 * Danh mục Khoa / Ngành (ADR-020).
 *
 * Danh sách này là **cùng một danh sách** với hằng số trong migration
 * `2026_10_30_000200_...` — bên đó đóng băng theo thời điểm chuyển dữ liệu, bên này
 * là bản đang dùng. Sửa một bên thì phải xem lại bên kia.
 *
 * `updateOrCreate` theo mã nên chạy lại chỉ cập nhật tên/trạng thái, không nhân bản.
 */
class KhoaNganhSeeder extends Seeder
{
    private const KHOA = [
        'ma_khoa' => 'CNTT',
        'ten_khoa' => 'Công nghệ thông tin',
        'mo_ta' => 'Khoa quản lý các ngành về công nghệ thông tin.',
    ];

    private const NGANH = [
        ['KTPM', 'Công nghệ phần mềm', 'Thiết kế, xây dựng và kiểm thử phần mềm.'],
        ['HTTT', 'Hệ thống thông tin', 'Xây dựng và vận hành hệ thống thông tin doanh nghiệp.'],
        ['KHMT', 'Khoa học máy tính', 'Thuật toán, học máy và khai phá dữ liệu.'],
        ['MTTT', 'Mạng và truyền thông', 'Hạ tầng mạng, truyền thông và điện toán đám mây.'],
        ['ATTT', 'An toàn thông tin', 'Bảo mật hệ thống, mật mã học và an ninh mạng.'],
    ];

    public function run(): void
    {
        $khoa = Khoa::query()->updateOrCreate(
            ['ma_khoa' => self::KHOA['ma_khoa']],
            [
                'ten_khoa' => self::KHOA['ten_khoa'],
                'mo_ta' => self::KHOA['mo_ta'],
                'trang_thai' => true,
            ],
        );

        foreach (self::NGANH as [$maNganh, $tenNganh, $moTa]) {
            Nganh::query()->updateOrCreate(
                ['ma_nganh' => $maNganh],
                [
                    'khoa_id' => $khoa->id,
                    'ten_nganh' => $tenNganh,
                    'mo_ta' => $moTa,
                    'trang_thai' => true,
                ],
            );
        }
    }
}
