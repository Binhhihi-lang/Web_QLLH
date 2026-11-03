<?php

namespace App\Http\Resources;

use App\Models\Nganh;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Nganh */
class NganhResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'khoa_id' => $this->khoa_id,
            'khoa' => $this->whenLoaded('khoa', fn () => $this->khoa === null ? null : [
                'id' => $this->khoa->id,
                'ma_khoa' => $this->khoa->ma_khoa,
                'ten_khoa' => $this->khoa->ten_khoa,
            ]),
            'ma_nganh' => $this->ma_nganh,
            'ten_nganh' => $this->ten_nganh,
            'mo_ta' => $this->mo_ta,
            'trang_thai' => $this->trang_thai,
            'da_xoa' => $this->trashed(),
        ];
    }
}
