<?php

namespace App\Http\Resources;

use App\Models\LichThi;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LichThi */
class LichThiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hoc_ky_id' => $this->hoc_ky_id,
            'mon_hoc_id' => $this->mon_hoc_id,
            'mon_hoc' => $this->relationLoaded('monHoc') && $this->monHoc !== null
                ? [
                    'id' => $this->monHoc->id,
                    'ma_mon' => $this->monHoc->ma_mon,
                    'ten_mon' => $this->monHoc->ten_mon,
                ]
                : null,
            'ngay_thi' => $this->ngay_thi->format('Y-m-d'),
            'tiet_bat_dau' => $this->tiet_bat_dau,
            'tiet_ket_thuc' => $this->tiet_ket_thuc,
            'gio_bat_dau' => substr($this->gio_bat_dau, 0, 5),
            'gio_ket_thuc' => substr($this->gio_ket_thuc, 0, 5),
            'phong_hoc' => $this->relationLoaded('phongHoc') && $this->phongHoc !== null
                ? [
                    'id' => $this->phongHoc->id,
                    'ma_phong' => $this->phongHoc->ma_phong,
                    'ten_phong' => $this->phongHoc->ten_phong,
                ]
                : null,
            'dot_thi' => $this->dot_thi,
            'ghi_chu' => $this->ghi_chu,
        ];
    }
}
