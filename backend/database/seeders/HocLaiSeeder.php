<?php

namespace Database\Seeders;

use App\Models\DangKyHocPhan;
use App\Models\Diem;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Dữ liệu mẫu cho luồng HỌC LẠI (2026-11-12).
 *
 * Chạy SAU DiemSeeder vì cần điểm của kỳ đã đóng mới biết ai chưa đạt.
 *
 * Luồng thật: sinh viên rớt môn ở kỳ trước đăng ký học lại vào lớp của khóa
 * dưới trong kỳ đang mở đợt đăng ký. Seeder bám đúng luồng đó:
 *   1. Lấy đăng ký ở kỳ đã đóng (2025-2) có `ket_qua = KHONG_DAT`.
 *   2. Tìm lớp OPEN của CÙNG môn ở kỳ sắp tới (2026-2, đang mở đợt).
 *   3. Tạo đăng ký mới cho chính sinh viên đó.
 *
 * KHÔNG sửa điểm cũ: điểm lần trước vẫn nằm trong lịch sử (BR-28), GPA lấy
 * điểm cao nhất.
 */
class HocLaiSeeder extends Seeder
{
    /** Số sinh viên học lại tối đa mỗi môn — để không dồn hết vào một lớp. */
    private const TOI_DA_MOI_MON = 4;

    public function run(): void
    {
        $hocKyCu = HocKy::query()->where('ma_hoc_ky', '2025-2')->first();
        $hocKyMoi = HocKy::query()->where('ma_hoc_ky', '2026-2')->first();
        $adminId = User::query()->where('email', 'admin@example.com')->value('id');

        if ($hocKyCu === null || $hocKyMoi === null || $adminId === null) {
            return;
        }

        // Môn chưa đạt ở kỳ cũ + sinh viên tương ứng.
        $monChuaDat = DangKyHocPhan::query()
            ->join('lop_hoc_phan', 'lop_hoc_phan.id', '=', 'dang_ky_hoc_phan.lop_hoc_phan_id')
            ->join('diem', 'diem.dang_ky_hoc_phan_id', '=', 'dang_ky_hoc_phan.id')
            ->where('dang_ky_hoc_phan.trang_thai', DangKyHocPhan::ACTIVE)
            ->where('lop_hoc_phan.hoc_ky_id', $hocKyCu->id)
            ->where('diem.ket_qua', Diem::KHONG_DAT)
            ->distinct()
            ->get([
                'dang_ky_hoc_phan.sinh_vien_id',
                'lop_hoc_phan.mon_hoc_id',
            ]);

        if ($monChuaDat->isEmpty()) {
            // Bảng quy đổi sinh điểm ngẫu nhiên nên hiếm khi rỗng; nếu rỗng thì
            // không bịa dữ liệu — bỏ qua và báo bằng comment.
            return;
        }

        // Lớp mở của kỳ mới theo môn, kèm sĩ số còn trống.
        $lopMoiTheoMon = LopHocPhan::query()
            ->where('hoc_ky_id', $hocKyMoi->id)
            ->where('trang_thai', LopHocPhan::OPEN)
            ->withCount(['dangKyHocPhan as so_dang_ky' => fn ($q) => $q->where('trang_thai', DangKyHocPhan::ACTIVE)])
            ->orderBy('id')
            ->get()
            ->groupBy('mon_hoc_id');

        $demTheoMon = [];
        $rows = [];
        $bayGio = now();

        foreach ($monChuaDat as $dong) {
            $monId = $dong->mon_hoc_id;

            if (! isset($lopMoiTheoMon[$monId])) {
                continue; // Kỳ mới không mở môn này — không tạo được, bỏ qua.
            }

            $dem = $demTheoMon[$monId] ?? 0;
            if ($dem >= self::TOI_DA_MOI_MON) {
                continue;
            }

            $lop = $lopMoiTheoMon[$monId]->first(fn ($l) => $l->so_dang_ky < $l->si_so_toi_da);
            if ($lop === null) {
                continue;
            }

            // Đã đăng ký môn này ở kỳ mới rồi thì thôi (seeder chạy lại được).
            $daDangKy = DangKyHocPhan::query()
                ->where('sinh_vien_id', $dong->sinh_vien_id)
                ->where('trang_thai', DangKyHocPhan::ACTIVE)
                ->whereHas('lopHocPhan', fn ($q) => $q
                    ->where('hoc_ky_id', $hocKyMoi->id)
                    ->where('mon_hoc_id', $monId))
                ->exists();
            if ($daDangKy) {
                continue;
            }

            $rows[] = [
                'sinh_vien_id' => $dong->sinh_vien_id,
                'lop_hoc_phan_id' => $lop->id,
                'trang_thai' => DangKyHocPhan::ACTIVE,
                'dang_ky_boi' => $adminId,
                'dang_ky_luc' => $bayGio,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ];

            $demTheoMon[$monId] = $dem + 1;
            $lop->so_dang_ky++;
        }

        if ($rows === []) {
            return;
        }

        DangKyHocPhan::query()->insert($rows);
    }
}
