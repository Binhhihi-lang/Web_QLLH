<?php

namespace App\Services;

use App\Models\CauHinh;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class QuanLyCauHinhService
{
    public function danhSach(): array
    {
        return CauHinh::query()
            ->get(['khoa', 'gia_tri'])
            ->mapWithKeys(fn (CauHinh $cauHinh) => [$cauHinh->khoa => $cauHinh->gia_tri])
            ->all();
    }

    public function capNhat(array $duLieu): array
    {
        $this->kiemTra($duLieu);

        return DB::transaction(function () use ($duLieu): array {
            $hienCo = CauHinh::query()
                ->whereIn('khoa', array_keys($duLieu))
                ->get()
                ->keyBy('khoa');

            foreach ($duLieu as $khoa => $giaTri) {
                CauHinh::dat($khoa, $giaTri, $hienCo->get($khoa)?->mo_ta);
            }

            return $this->danhSach();
        });
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
            'gia_tri.*' => ['required', 'array:tu,den,chu,he_4,dat'],
            'gia_tri.*.tu' => ['required', 'numeric', 'between:0,10'],
            'gia_tri.*.den' => ['required', 'numeric', 'between:0,10'],
            'gia_tri.*.chu' => ['required', 'string', 'in:A,B,C,D,F'],
            'gia_tri.*.he_4' => ['required', 'numeric', 'between:0,4'],
            'gia_tri.*.dat' => ['required', 'boolean'],
        ]);

        if ($validator->fails()) {
            $this->baoLoi('diem.bang_quy_doi', 'Mỗi khoảng cần có tu, den, chu, he_4 và dat hợp lệ.');
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
