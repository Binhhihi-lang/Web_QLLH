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
            'nganh_id' => $this->nganh_id,
            'nganh' => $this->whenLoaded('nganh', fn () => $this->nganh === null ? null : [
                'id' => $this->nganh->id,
                'ma_nganh' => $this->nganh->ma_nganh,
                'ten_nganh' => $this->nganh->ten_nganh,
                'khoa_id' => $this->nganh->khoa_id,
            ]),
            // `whenLoaded` không hiểu đường dẫn lồng, nên kiểm tra ở cấp `nganh`
            // rồi mới đọc tiếp `nganh.khoa` (controller đã eager load 'nganh.khoa').
            'khoa' => $this->whenLoaded('nganh', fn () => $this->nganh?->khoa === null ? null : [
                'id' => $this->nganh->khoa->id,
                'ma_khoa' => $this->nganh->khoa->ma_khoa,
                'ten_khoa' => $this->nganh->khoa->ten_khoa,
            ]),
            'nam_nhap_hoc' => $this->nam_nhap_hoc,
            'mo_ta' => $this->mo_ta,
            'si_so' => (int) ($this->sinh_vien_count ?? $this->sinhVien()->count()),
            'trang_thai' => $this->trang_thai,
            'da_xoa' => $this->trashed(),
        ];
    }
}
