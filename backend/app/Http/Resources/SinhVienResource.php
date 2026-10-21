<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SinhVienResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_sv' => $this->ma_sv,
            'ho_ten' => $this->ho_ten,
            'email' => $this->email,
            'ngay_sinh' => $this->ngay_sinh?->format('Y-m-d'),
            'gioi_tinh' => (bool) $this->gioi_tinh,
            'lop_hoc_id' => $this->lop_hoc_id,
            'so_dien_thoai' => $this->so_dien_thoai,
            'dia_chi' => $this->dia_chi,
            'trang_thai' => (bool) $this->trang_thai,
            // Chỉ kèm khi controller đã eager load quan hệ.
            'lop_hoc' => new LopHocResource($this->whenLoaded('lopHoc')),
        ];
    }
}
