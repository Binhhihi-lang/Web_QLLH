<?php

namespace App\Services;

use App\Models\CauHinh;
use App\Models\HocKy;
use App\Models\QuyDoiDiem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class QuanLyCauHinhService
{
    public function danhSach(?int $hocKyId = null): array
    {
        $cauHinh = CauHinh::query()
            ->get(['khoa', 'gia_tri'])
            ->mapWithKeys(fn (CauHinh $cauHinh) => [$cauHinh->khoa => $cauHinh->gia_tri])
            ->all();

        if ($hocKyId !== null) {
            $hocKy = HocKy::query()->findOrFail($hocKyId);
            $quyDoi = QuyDoiDiem::query()->where('hoc_ky_id', $hocKy->id)->first();
            if ($quyDoi !== null) {
                $cauHinh['diem.trong_so'] = $quyDoi->trong_so;
                $cauHinh['diem.bang_quy_doi'] = $quyDoi->bang_quy_doi;
                $cauHinh['diem.diem_danh.sua_trong_so_ngay'] = $quyDoi->so_ngay_sua_diem_danh;
            }
            $cauHinh['diem.cau_hinh_hoc_ky'] = $quyDoi === null ? null : [
                'id' => $quyDoi->id,
                'hoc_ky_id' => $hocKy->id,
                'quy_tac_lam_tron' => $quyDoi->quy_tac_lam_tron,
            ];
        }

        return $cauHinh;
    }

    /** @return array<int, array<string, mixed>> */
    public function danhSachHocKy(): array
    {
        return HocKy::query()
            ->with('quyDoiDiem:id,hoc_ky_id')
            ->orderByDesc('ngay_bat_dau')
            ->get()
            ->map(fn (HocKy $hocKy) => [
                'id' => $hocKy->id,
                'ma_hoc_ky' => $hocKy->ma_hoc_ky,
                'ten_hoc_ky' => $hocKy->ten_hoc_ky,
                'label' => $hocKy->ten_hoc_ky,
                'nam_hoc' => $hocKy->nam_hoc,
                'ky_thu' => $hocKy->ky_thu,
                'ngay_bat_dau' => $hocKy->ngay_bat_dau->toDateString(),
                'ngay_ket_thuc' => $hocKy->ngay_ket_thuc->toDateString(),
                'mo_dang_ky_luc' => $hocKy->mo_dang_ky_luc->format('Y-m-d H:i:s'),
                'dong_dang_ky_luc' => $hocKy->dong_dang_ky_luc->format('Y-m-d H:i:s'),
                'trang_thai' => $hocKy->trang_thai,
                'cau_hinh_da_luu' => $hocKy->quyDoiDiem !== null,
            ])
            ->all();
    }

    public function capNhat(array $duLieu): array
    {
        $hocKyId = $duLieu['hoc_ky_id'] ?? null;
        if (! is_numeric($hocKyId)) {
            $this->baoLoi('hoc_ky_id', 'Cần chọn học kỳ để lưu cấu hình.');
        }

        return DB::transaction(function () use ($duLieu, $hocKyId): array {
            $hocKy = HocKy::query()->lockForUpdate()->findOrFail((int) $hocKyId);
            if ($hocKy->trang_thai !== HocKy::UPCOMING) {
                throw new \App\Exceptions\LoiNghiepVu(
                    'SEMESTER_CONFIG_LOCKED',
                    'Chỉ được sửa cấu hình của học kỳ sắp diễn ra.',
                );
            }

            $cauHinhDaLuu = QuyDoiDiem::query()->where('hoc_ky_id', $hocKy->id)->first();
            $trongSo = $cauHinhDaLuu?->trong_so
                ?? CauHinh::lay('diem.trong_so', []);
            $bangQuyDoi = $cauHinhDaLuu?->bang_quy_doi
                ?? CauHinh::lay('diem.bang_quy_doi', []);
            $soNgay = $cauHinhDaLuu?->so_ngay_sua_diem_danh
                ?? CauHinh::lay('diem.diem_danh.sua_trong_so_ngay', 7);

            if (array_key_exists('diem.trong_so', $duLieu)) {
                $trongSo = $duLieu['diem.trong_so'];
            }
            if (array_key_exists('diem.bang_quy_doi', $duLieu)) {
                $bangQuyDoi = $duLieu['diem.bang_quy_doi'];
            }
            if (array_key_exists('diem.diem_danh.sua_trong_so_ngay', $duLieu)) {
                $soNgay = $duLieu['diem.diem_danh.sua_trong_so_ngay'];
            }
            $this->kiemTra([
                'diem.trong_so' => $trongSo,
                'diem.bang_quy_doi' => $bangQuyDoi,
                'diem.diem_danh.sua_trong_so_ngay' => $soNgay,
            ]);

            QuyDoiDiem::query()->updateOrCreate(
                ['hoc_ky_id' => $hocKy->id],
                [
                'trong_so' => $trongSo,
                'bang_quy_doi' => $bangQuyDoi,
                'so_ngay_sua_diem_danh' => $soNgay,
                'quy_tac_lam_tron' => QuyDoiDiem::QUY_TAC_LAM_TRON,
                ],
            );

            return $this->danhSach($hocKy->id);
        });
    }

    public function layApDungChoHocKy(HocKy $hocKy): QuyDoiDiem
    {
        return QuyDoiDiem::query()->firstOrCreate(
            ['hoc_ky_id' => $hocKy->id],
            [
                'trong_so' => CauHinh::lay('diem.trong_so'),
                'bang_quy_doi' => CauHinh::lay('diem.bang_quy_doi'),
                'so_ngay_sua_diem_danh' => CauHinh::lay('diem.diem_danh.sua_trong_so_ngay', 7),
                'quy_tac_lam_tron' => QuyDoiDiem::QUY_TAC_LAM_TRON,
            ],
        );
    }

    private function kiemTra(array $duLieu): void
    {
        if ($duLieu === [] || array_is_list($duLieu)) {
            $this->baoLoi('settings', 'Cần gửi object cấu hình có ít nhất một khóa.');
        }

        foreach ($duLieu as $khoa => $giaTri) {
            if (! is_string($khoa) || trim($khoa) === '' || mb_strlen($khoa) > 100) {
                $this->baoLoi('settings', 'Khóa cấu hình phải là chuỗi từ 1 đến 100 ký tự.');
            }

            if ($khoa === 'diem.trong_so') {
                $this->kiemTraTrongSo($giaTri);
            } elseif ($khoa === 'diem.bang_quy_doi') {
                $this->kiemTraBangQuyDoi($giaTri);
            } elseif ($khoa === 'diem.diem_danh.sua_trong_so_ngay') {
                $this->kiemTraSoNgay($giaTri);
            }
        }
    }

    private function kiemTraTrongSo(mixed $giaTri): void
    {
        $validator = Validator::make(['gia_tri' => $giaTri], [
            'gia_tri' => ['required', 'array:chuyen_can,giua_ky,cuoi_ky'],
            'gia_tri.chuyen_can' => ['required', 'numeric', 'between:0,1'],
            'gia_tri.giua_ky' => ['required', 'numeric', 'between:0,1'],
            'gia_tri.cuoi_ky' => ['required', 'numeric', 'between:0,1'],
        ]);

        if ($validator->fails()
            || abs(array_sum($giaTri) - 1) > 0.00001) {
            $this->baoLoi('diem.trong_so', 'Trọng số phải có đủ ba thành phần trong khoảng 0–1 và tổng bằng 1.');
        }
    }

    private function kiemTraBangQuyDoi(mixed $giaTri): void
    {
        if (! is_array($giaTri) || ! array_is_list($giaTri) || $giaTri === []) {
            $this->baoLoi('diem.bang_quy_doi', 'Bảng quy đổi phải là một danh sách khoảng điểm.');
        }

        $validator = Validator::make(['gia_tri' => $giaTri], [
            'gia_tri.*' => ['required', 'array:tu,den,chu,he_4,xep_loai,dat'],
            'gia_tri.*.tu' => ['required', 'numeric', 'between:0,10'],
            'gia_tri.*.den' => ['required', 'numeric', 'between:0,10'],
            'gia_tri.*.chu' => ['required', 'string', 'in:A,B+,B,C+,C,D+,D,F'],
            'gia_tri.*.he_4' => ['required', 'numeric', 'between:0,4'],
            'gia_tri.*.xep_loai' => ['required', 'string', 'max:100'],
            'gia_tri.*.dat' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            $this->baoLoi('diem.bang_quy_doi', 'Mỗi khoảng cần có tu, den, chu, he_4, xep_loai và dat hợp lệ.');
        }

        $khoang = [];
        foreach ($giaTri as $dong) {
            $tu = (float) $dong['tu'];
            $den = (float) $dong['den'];

            if ($den < $tu || abs($tu * 100 - round($tu * 100)) > 0.00001
                || abs($den * 100 - round($den * 100)) > 0.00001) {
                $this->baoLoi('diem.bang_quy_doi', 'Khoảng điểm phải hợp lệ và dùng tối đa hai chữ số thập phân.');
            }

            $khoang[] = [(int) round($tu * 100), (int) round($den * 100)];
        }

        usort($khoang, fn (array $a, array $b) => $a[0] <=> $b[0]);

        if ($khoang[0][0] !== 0 || $khoang[array_key_last($khoang)][1] !== 1000) {
            $this->baoLoi('diem.bang_quy_doi', 'Các khoảng điểm phải phủ kín từ 0 đến 10.');
        }

        for ($i = 1; $i < count($khoang); $i++) {
            if ($khoang[$i][0] <= $khoang[$i - 1][1]) {
                $this->baoLoi('diem.bang_quy_doi', 'Các khoảng điểm không được chồng lấn.');
            }

            if ($khoang[$i][0] !== $khoang[$i - 1][1] + 1) {
                $this->baoLoi('diem.bang_quy_doi', 'Các khoảng điểm không được có khoảng trống.');
            }
        }
    }

    private function kiemTraSoNgay(mixed $giaTri): void
    {
        $validator = Validator::make(['gia_tri' => $giaTri], [
            'gia_tri' => ['required', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            $this->baoLoi('diem.diem_danh.sua_trong_so_ngay', 'Số ngày phải là số nguyên không âm.');
        }
    }

    private function baoLoi(string $khoa, string $thongBao): never
    {
        throw ValidationException::withMessages([$khoa => [$thongBao]]);
    }
}
