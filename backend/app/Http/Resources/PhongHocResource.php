<?php

namespace App\Http\Resources;

use App\Models\PhongHoc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PhongHoc */
class PhongHocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_phong' => $this->ma_phong,
            'ten_phong' => $this->ten_phong,
            'suc_chua' => $this->suc_chua,
            'trang_thai' => $this->trang_thai,
            'da_xoa' => $this->trashed(),
        ];
    }
}
