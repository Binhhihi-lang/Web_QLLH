<?php

namespace App\Http\Resources;

use App\Models\Khoa;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Khoa */
class KhoaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_khoa' => $this->ma_khoa,
            'ten_khoa' => $this->ten_khoa,
            'mo_ta' => $this->mo_ta,
            'trang_thai' => $this->trang_thai,
            'so_nganh' => (int) ($this->nganh_count ?? $this->nganh()->count()),
            'da_xoa' => $this->trashed(),
        ];
    }
}
