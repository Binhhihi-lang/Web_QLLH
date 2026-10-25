<?php

namespace App\Http\Resources;

use App\Models\LopHanhChinh;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LopHanhChinh */
class LopHanhChinhResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_lop' => $this->ma_lop,
            'ten_lop' => $this->ten_lop,
            'khoa_hoc' => $this->khoa_hoc,
            'nganh' => $this->nganh,
            'nam_nhap_hoc' => $this->nam_nhap_hoc,
            'mo_ta' => $this->mo_ta,
            'si_so' => (int) ($this->sinh_vien_count ?? $this->sinhVien()->count()),
            'trang_thai' => $this->trang_thai,
            'da_xoa' => $this->trashed(),
        ];
    }
}
