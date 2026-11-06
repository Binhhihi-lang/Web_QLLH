<?php

namespace App\Http\Resources;

use App\Models\HocKy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin HocKy */
class HocKyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_hoc_ky' => $this->ma_hoc_ky,
            'ten_hoc_ky' => $this->ten_hoc_ky,
            'nam_hoc' => $this->nam_hoc,
            'ky_thu' => $this->ky_thu,
            'ngay_bat_dau' => $this->ngay_bat_dau->format('Y-m-d'),
            'ngay_ket_thuc' => $this->ngay_ket_thuc->format('Y-m-d'),
            'mo_dang_ky_luc' => $this->mo_dang_ky_luc->format('Y-m-d H:i:s'),
            'dong_dang_ky_luc' => $this->dong_dang_ky_luc->format('Y-m-d H:i:s'),
            'trang_thai' => $this->trang_thai,
            'dang_mo_dang_ky' => $this->dangMoDangKy(),
        ];
    }
}
