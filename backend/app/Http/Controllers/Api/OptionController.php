<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GiangVien;
use App\Models\HocKy;
use App\Models\Khoa;
use App\Models\LopHanhChinh;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\Nganh;
use App\Models\PhongHoc;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Dữ liệu gọn cho ô chọn (dropdown) ở FE — docs/04-api-contract.md mục options.
 */
class OptionController extends Controller
{
    use ApiResponseTrait;

    public function subjects(Request $request)
    {
        $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'limit' => ['sometimes', 'integer', 'between:1,200'],
        ]);

        $data = MonHoc::query()
            ->with('khoa:id,ma_khoa,ten_khoa')
            ->where('trang_thai', true)
            ->orderBy('ten_mon')
            ->get(['id', 'ma_mon', 'khoa_id', 'ten_mon', 'so_tin_chi'])
            ->map(fn (MonHoc $m) => [
                'id' => $m->id,
                'ma_mon' => $m->ma_mon,
                'label' => $m->ten_mon,
                'ten_mon' => $m->ten_mon,
                'so_tin_chi' => $m->so_tin_chi,
                'khoa_id' => $m->khoa_id,
            ]);

        return $this->success($this->locTheoTuKhoa($data, $request));
    }

    public function semesters()
    {
        $data = HocKy::query()
            ->orderByDesc('ngay_bat_dau')
            ->get(['id', 'ten_hoc_ky', 'nam_hoc', 'ngay_bat_dau', 'ngay_ket_thuc', 'trang_thai'])
            ->map(fn (HocKy $h) => [
                'id' => $h->id,
                'label' => $h->ten_hoc_ky,
                'nam_hoc' => $h->nam_hoc,
                'ngay_bat_dau' => $h->ngay_bat_dau->toDateString(),
                'ngay_ket_thuc' => $h->ngay_ket_thuc->toDateString(),
                'trang_thai' => $h->trang_thai,
            ]);

        return $this->success($data);
    }

    public function teachers(Request $request)
    {
        $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'limit' => ['sometimes', 'integer', 'between:1,200'],
        ]);

        $data = GiangVien::query()
            ->where('trang_thai', true)
            ->orderBy('ho_ten')
            ->get(['id', 'ma_gv', 'ho_ten'])
            ->map(fn (GiangVien $g) => [
                'id' => $g->id,
                'ma_gv' => $g->ma_gv,
                'label' => $g->ho_ten,
                'ho_ten' => $g->ho_ten,
            ]);

        return $this->success($this->locTheoTuKhoa($data, $request));
    }

    /**
     * Tìm theo mã hoặc tên, không phân biệt dấu: gõ "ly thuyet" vẫn ra
     * "Lý thuyết tối ưu". Danh mục nhỏ nên lọc trong PHP cho đồng nhất
     * giữa MySQL và SQLite (test).
     */
    private function locTheoTuKhoa($data, Request $request)
    {
        $tuKhoa = trim((string) $request->query('q', ''));

        if ($tuKhoa !== '') {
            $kim = Str::ascii(mb_strtolower($tuKhoa));
            $data = $data
                ->filter(fn (array $dong) => str_contains(
                    Str::ascii(mb_strtolower(implode(' ', array_filter([
                        $dong['ma_mon'] ?? $dong['ma_gv'] ?? '',
                        $dong['ten_mon'] ?? $dong['ho_ten'] ?? '',
                    ])))),
                    $kim,
                ))
                ->values();
        }

        $gioiHan = $request->integer('limit', 0);

        return $gioiHan > 0 ? $data->take($gioiHan)->values() : $data;
    }

    public function rooms()
    {
        $data = PhongHoc::query()
            ->where('trang_thai', true)
            ->orderBy('ma_phong')
            ->get(['id', 'ma_phong', 'ten_phong', 'suc_chua'])
            ->map(fn (PhongHoc $p) => [
                'id' => $p->id,
                'ma_phong' => $p->ma_phong,
                'label' => $p->ten_phong,
                'suc_chua' => $p->suc_chua,
            ]);

        return $this->success($data);
    }

    /**
     * Khung tiết của trường — dùng cho ô chọn tiết ở form lịch học và ca thi.
     */
    public function periods()
    {
        $data = \App\Models\TietHoc::query()
            ->orderBy('so_tiet')
            ->get(['id', 'so_tiet', 'ca', 'gio_bat_dau', 'gio_ket_thuc'])
            ->map(fn (\App\Models\TietHoc $t) => [
                'id' => $t->id,
                'so_tiet' => $t->so_tiet,
                'ca' => $t->ca,
                'label' => 'Tiết '.$t->so_tiet.' ('.substr($t->gio_bat_dau, 0, 5).'–'.substr($t->gio_ket_thuc, 0, 5).')',
                'gio_bat_dau' => substr($t->gio_bat_dau, 0, 5),
                'gio_ket_thuc' => substr($t->gio_ket_thuc, 0, 5),
            ]);

        return $this->success($data);
    }

    public function adminClasses()
    {
        $data = LopHanhChinh::query()
            ->with('nganh:id,ma_nganh,ten_nganh')
            ->where('trang_thai', true)
            ->orderBy('ma_lop')
            ->get(['id', 'ten_lop', 'khoa_hoc', 'nganh_id'])
            ->map(fn (LopHanhChinh $l) => [
                'id' => $l->id,
                'label' => $l->ten_lop,
                'khoa_hoc' => $l->khoa_hoc,
                'nganh_id' => $l->nganh_id,
                'nganh' => $l->nganh?->ten_nganh,
            ]);

        return $this->success($data);
    }

    public function khoa()
    {
        $data = Khoa::query()
            ->where('trang_thai', true)
            ->orderBy('ten_khoa')
            ->get(['id', 'ma_khoa', 'ten_khoa'])
            ->map(fn (Khoa $k) => [
                'id' => $k->id,
                'label' => $k->ten_khoa,
                'ma_khoa' => $k->ma_khoa,
            ]);

        return $this->success($data);
    }

    /**
     * `khoa_id` là tham số tùy chọn để dựng dropdown phụ thuộc (chọn khoa rồi mới ra ngành).
     */
    public function nganh(Request $request)
    {
        $request->validate([
            'khoa_id' => ['sometimes', 'integer'],
        ]);

        $data = Nganh::query()
            ->where('trang_thai', true)
            ->when($request->filled('khoa_id'), fn ($truyVan) => $truyVan->where('khoa_id', $request->integer('khoa_id')))
            ->orderBy('ten_nganh')
            ->get(['id', 'khoa_id', 'ma_nganh', 'ten_nganh'])
            ->map(fn (Nganh $n) => [
                'id' => $n->id,
                'label' => $n->ten_nganh,
                'khoa_id' => $n->khoa_id,
                'ma_nganh' => $n->ma_nganh,
            ]);

        return $this->success($data);
    }

    public function sections()
    {
        $data = LopHocPhan::query()
            ->with('monHoc:id,ten_mon')
            ->withCount(['dangKyHocPhan as so_dang_ky' => fn ($q) => $q->where('trang_thai', 'ACTIVE')])
            ->where('trang_thai', LopHocPhan::OPEN)
            ->orderBy('ma_lop_hp')
            ->get(['id', 'ma_lop_hp', 'mon_hoc_id', 'si_so_toi_da', 'nam_thu'])
            ->map(fn (LopHocPhan $l) => [
                'id' => $l->id,
                'label' => $l->ma_lop_hp.' — '.($l->monHoc?->ten_mon ?? ''),
                'con_cho' => max(0, $l->si_so_toi_da - $l->so_dang_ky),
                'nam_thu' => $l->nam_thu,
            ]);

        return $this->success($data);
    }
}
