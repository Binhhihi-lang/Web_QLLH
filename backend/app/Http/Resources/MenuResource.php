<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ten' => $this->ten,
            'url' => $this->url,
            'vi_tri' => $this->vi_tri,
            'nhom' => $this->nhom,
            'vai_tro' => $this->vai_tro,
            'thu_tu' => $this->thu_tu,
            'trang_thai' => $this->trang_thai,
        ];
    }
}
