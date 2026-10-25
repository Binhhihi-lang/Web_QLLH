<?php

namespace App\Http\Resources;

use App\Models\SinhVien;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SinhVien */
class SinhVienResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $laGiangVien = $request->user()?->laGiangVien() ?? false;

        return [
            'id' => $this->id,
            'ma_sv' => $this->ma_sv,
            'ho_ten' => $this->ho_ten,
            'ngay_sinh' => $this->when(! $laGiangVien, $this->ngay_sinh?->format('Y-m-d')),
            'gioi_tinh' => $this->when(! $laGiangVien, $this->gioi_tinh),
            'email' => $this->email,
            'so_dien_thoai' => $this->so_dien_thoai,
            'dia_chi' => $this->when(! $laGiangVien, $this->dia_chi),
            'trang_thai' => $this->when(! $laGiangVien, $this->trang_thai),
            'lop_hanh_chinh' => $this->whenLoaded('lopHanhChinh', fn () => $this->lopHanhChinh === null ? null : [
                'id' => $this->lopHanhChinh->id,
                'ma_lop' => $this->lopHanhChinh->ma_lop,
                'ten_lop' => $this->lopHanhChinh->ten_lop,
            ]),
            'avatar_url' => $this->when(! $laGiangVien, $this->relationLoaded('user') ? $this->user?->avatar_url : null),
            'da_xoa' => $this->when(! $laGiangVien, $this->trashed()),
        ];
    }
}
