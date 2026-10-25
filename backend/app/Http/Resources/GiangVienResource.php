<?php

namespace App\Http\Resources;

use App\Models\GiangVien;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin GiangVien */
class GiangVienResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_gv' => $this->ma_gv,
            'ho_ten' => $this->ho_ten,
            'email' => $this->email,
            'so_dien_thoai' => $this->so_dien_thoai,
            'chuyen_mon' => $this->chuyen_mon,
            'trang_thai' => $this->trang_thai,
            'avatar_url' => $this->relationLoaded('user') ? $this->user?->avatar_url : null,
            'da_xoa' => $this->trashed(),
        ];
    }
}
