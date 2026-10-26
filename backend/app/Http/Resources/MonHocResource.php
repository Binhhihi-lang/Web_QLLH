<?php

namespace App\Http\Resources;

use App\Models\MonHoc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MonHoc */
class MonHocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_mon' => $this->ma_mon,
            'ten_mon' => $this->ten_mon,
            'so_tin_chi' => $this->so_tin_chi,
            'mo_ta' => $this->mo_ta,
            'trang_thai' => $this->trang_thai,
            'da_xoa' => $this->trashed(),
        ];
    }
}
