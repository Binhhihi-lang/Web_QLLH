<?php

namespace App\Http\Resources;

use App\Models\BuoiHoc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BuoiHoc */
class LichHocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $lop = $this->lopHocPhan;

        return [
            'id' => $this->id,
            'ngay_hoc' => $this->ngay_hoc->format('Y-m-d'),
            'gio_bat_dau' => substr($this->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($this->gio_ket_thuc, 0, 5),
            'trang_thai' => $this->trang_thai,
            'ly_do_huy' => $this->ly_do_huy,
            'lop_hoc_phan' => ['id' => $lop->id, 'ma_lop_hp' => $lop->ma_lop_hp],
            'mon_hoc' => $lop->monHoc === null ? null : [
                'id' => $lop->monHoc->id, 'ma_mon' => $lop->monHoc->ma_mon, 'ten_mon' => $lop->monHoc->ten_mon,
            ],
            'hoc_ky' => $lop->hocKy === null ? null : [
                'id' => $lop->hocKy->id, 'ma_hoc_ky' => $lop->hocKy->ma_hoc_ky, 'ten_hoc_ky' => $lop->hocKy->ten_hoc_ky,
            ],
            'giang_vien' => $lop->giangVien === null ? null : [
                'id' => $lop->giangVien->id, 'ma_gv' => $lop->giangVien->ma_gv, 'ho_ten' => $lop->giangVien->ho_ten,
                'da_xoa' => $lop->giangVien->trashed(),
            ],
            'phong_hoc' => $this->phongHoc === null ? null : [
                'id' => $this->phongHoc->id, 'ma_phong' => $this->phongHoc->ma_phong, 'ten_phong' => $this->phongHoc->ten_phong,
                'da_xoa' => $this->phongHoc->trashed(),
            ],
        ];
    }
}
