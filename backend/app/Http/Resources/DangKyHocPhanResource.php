<?php

namespace App\Http\Resources;

use App\Models\DangKyHocPhan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DangKyHocPhan */
class DangKyHocPhanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sinh_vien' => $this->whenLoaded('sinhVien', fn () => [
                'id' => $this->sinhVien->id,
                'ma_sv' => $this->sinhVien->ma_sv,
                'ho_ten' => $this->sinhVien->ho_ten,
            ]),
            'lop_hoc_phan' => $this->whenLoaded('lopHocPhan', fn () => [
                'id' => $this->lopHocPhan->id,
                'ma_lop_hp' => $this->lopHocPhan->ma_lop_hp,
                'mon_hoc' => $this->lopHocPhan->relationLoaded('monHoc') && $this->lopHocPhan->monHoc
                    ? $this->lopHocPhan->monHoc->ten_mon
                    : null,
                'hoc_ky' => $this->lopHocPhan->relationLoaded('hocKy') && $this->lopHocPhan->hocKy
                    ? [
                        'id' => $this->lopHocPhan->hocKy->id,
                        'ma_hoc_ky' => $this->lopHocPhan->hocKy->ma_hoc_ky,
                        'ten_hoc_ky' => $this->lopHocPhan->hocKy->ten_hoc_ky,
                    ]
                    : null,
            ]),
            'trang_thai' => $this->trang_thai,
            'dang_ky_boi' => $this->whenLoaded('nguoiDangKy', fn () => [
                'id' => $this->nguoiDangKy?->id,
                'name' => $this->nguoiDangKy?->name,
            ]),
            'dang_ky_luc' => $this->dang_ky_luc?->format('Y-m-d H:i:s'),
            'huy_boi' => $this->whenLoaded('nguoiHuy', fn () => $this->nguoiHuy === null ? null : [
                'id' => $this->nguoiHuy->id,
                'name' => $this->nguoiHuy->name,
            ]),
            'huy_luc' => $this->huy_luc?->format('Y-m-d H:i:s'),
            'ly_do_huy' => $this->ly_do_huy,
        ];
    }
}
