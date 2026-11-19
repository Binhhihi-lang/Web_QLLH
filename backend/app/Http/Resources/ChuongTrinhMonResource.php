<?php

namespace App\Http\Resources;

use App\Models\ChuongTrinhMon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChuongTrinhMon */
class ChuongTrinhMonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chuong_trinh_id' => $this->chuong_trinh_id,
            'mon_hoc_id' => $this->mon_hoc_id,
            'mon_hoc' => $this->whenLoaded('monHoc', fn () => $this->monHoc === null ? null : [
                'id' => $this->monHoc->id,
                'ma_mon' => $this->monHoc->ma_mon,
                'ten_mon' => $this->monHoc->ten_mon,
                'so_tin_chi' => $this->monHoc->so_tin_chi,
            ]),
            // null = chưa gán kỳ, sinh viên không thấy môn này khi đăng ký.
            'ky_thu' => $this->ky_thu,
            'bat_buoc' => $this->bat_buoc,
        ];
    }
}
