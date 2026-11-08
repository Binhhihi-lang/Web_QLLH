<?php

namespace App\Http\Resources;

use App\Models\BuoiHoc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BuoiHoc */
class BuoiHocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'lop_hoc_phan_id' => $this->lop_hoc_phan_id,
            'ngay_hoc' => $this->ngay_hoc->format('Y-m-d'),
            'tiet_bat_dau' => $this->tiet_bat_dau,
            'tiet_ket_thuc' => $this->tiet_ket_thuc,
            'gio_bat_dau' => substr($this->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($this->gio_ket_thuc, 0, 5),
            'trang_thai' => $this->trang_thai,
            'hinh_thuc' => $this->hinh_thuc,
            'ly_do_huy' => $this->ly_do_huy,
            'buoi_goc_id' => $this->buoi_goc_id,
            'phong_hoc' => $this->relationLoaded('phongHoc') && $this->phongHoc !== null
                ? [
                    'id' => $this->phongHoc->id,
                    'ma_phong' => $this->phongHoc->ma_phong,
                    'ten_phong' => $this->phongHoc->ten_phong,
                ]
                : null,
            'da_diem_danh' => (int) ($this->diem_danh_count ?? 0) > 0,
            'so_diem_danh' => (int) ($this->diem_danh_count ?? 0),
        ];
    }
}
