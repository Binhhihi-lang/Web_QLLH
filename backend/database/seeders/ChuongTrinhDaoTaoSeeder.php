<?php

namespace Database\Seeders;

use App\Models\ChuongTrinhDaoTao;
use App\Models\ChuongTrinhMon;
use App\Models\MonHoc;
use App\Models\Nganh;
use Illuminate\Database\Seeder;

/**
 * Chương trình đào tạo mẫu: mỗi ngành × mỗi khóa đang áp dụng có một chương trình,
 * mỗi chương trình có đủ 30 môn của khoa CNTT chia theo kỳ thứ 1–10.
 *
 * Chạy SAU `DanhMucSeeder` (cần ngành + môn có sẵn).
 *
 * Chia kỳ: 30 môn rải đều 10 kỳ, mỗi kỳ 3 môn. Môn cuối (Thực tập tốt nghiệp,
 * Đồ án chuyên ngành) để kỳ 9–10 cho hợp lý.
 */
class ChuongTrinhDaoTaoSeeder extends Seeder
{
    public function run(): void
    {
        if (ChuongTrinhDaoTao::query()->exists()) {
            return;
        }

        $nganh = Nganh::query()->orderBy('id')->get(['id', 'ma_nganh', 'ten_nganh']);
        $monIds = MonHoc::query()->orderBy('id')->pluck('id')->all();

        if ($nganh->isEmpty() || $monIds === []) {
            return;
        }

        // Khóa đang áp dụng — trùng `lop_hanh_chinh.khoa_hoc`.
        $khoaHocs = ['K63', 'K64', 'K65', 'K66', 'K67'];

        $bayGio = now();
        $rowsCt = [];
        $rowsMon = [];

        foreach ($nganh as $n) {
            foreach ($khoaHocs as $khoa) {
                $rowsCt[] = [
                    'ma_ctdt' => sprintf('CT-%s-%s', $n->ma_nganh, $khoa),
                    'nganh_id' => $n->id,
                    'khoa_hoc' => $khoa,
                    'ten' => sprintf('%s — Khóa %s', $n->ten_nganh, $khoa),
                    'so_nam' => 4.0,
                    'so_ky' => 8,
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        ChuongTrinhDaoTao::query()->insert($rowsCt);

        // Sinh môn cho từng chương trình vừa tạo.
        $chuongTrinhs = ChuongTrinhDaoTao::query()->orderBy('id')->get(['id']);
        $soMon = count($monIds);
        $soKy = 10;

        foreach ($chuongTrinhs as $ct) {
            foreach ($monIds as $viTri => $monId) {
                // Môn thứ i rơi vào kỳ (i / 3) + 1, chặn trên ở 10.
                $kyThu = min($soKy, intdiv($viTri, 3) + 1);

                $rowsMon[] = [
                    'chuong_trinh_id' => $ct->id,
                    'mon_hoc_id' => $monId,
                    'ky_thu' => $kyThu,
                    // Ba môn cuối (đồ án, thực tập, pháp luật) là tự chọn.
                    'bat_buoc' => $viTri < $soMon - 3,
                    'created_at' => $bayGio,
                    'updated_at' => $bayGio,
                ];
            }
        }

        foreach (array_chunk($rowsMon, 500) as $chunk) {
            ChuongTrinhMon::query()->insert($chunk);
        }
    }
}
