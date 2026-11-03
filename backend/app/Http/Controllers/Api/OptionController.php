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

/**
 * Dữ liệu gọn cho ô chọn (dropdown) ở FE — docs/04-api-contract.md mục options.
 */
class OptionController extends Controller
{
    use ApiResponseTrait;

    public function subjects()
    {
        $data = MonHoc::query()
            ->with('khoa:id,ma_khoa,ten_khoa')
            ->where('trang_thai', true)
            ->orderBy('ten_mon')
            ->get(['id', 'khoa_id', 'ten_mon', 'so_tin_chi'])
            ->map(fn (MonHoc $m) => [
                'id' => $m->id,
                'label' => $m->ten_mon,
                'so_tin_chi' => $m->so_tin_chi,
                'khoa_id' => $m->khoa_id,
            ]);

        return $this->success($data);
    }

    public function semesters()
    {
        $data = HocKy::query()
            ->orderByDesc('ngay_bat_dau')
            ->get(['id', 'ten_hoc_ky', 'trang_thai', 'nam_hoc', 'ky_thu'])
            ->map(fn (HocKy $h) => [
                'id' => $h->id,
                'label' => $h->ten_hoc_ky,
                'trang_thai' => $h->trang_thai,
                'nam_hoc' => $h->nam_hoc,
                'ky_thu' => $h->ky_thu,
            ]);

        return $this->success($data);
    }

    public function teachers()
    {
        $data = GiangVien::query()
            ->where('trang_thai', true)
            ->orderBy('ho_ten')
            ->get(['id', 'ho_ten'])
            ->map(fn (GiangVien $g) => [
                'id' => $g->id,
                'label' => $g->ho_ten,
            ]);

        return $this->success($data);
    }

    public function rooms()
    {
        $data = PhongHoc::query()
            ->where('trang_thai', true)
            ->orderBy('ma_phong')
            ->get(['id', 'ten_phong', 'suc_chua'])
            ->map(fn (PhongHoc $p) => [
                'id' => $p->id,
                'label' => $p->ten_phong,
                'suc_chua' => $p->suc_chua,
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
