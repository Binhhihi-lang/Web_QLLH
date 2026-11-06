<?php

namespace App\Http\Resources;

use App\Models\NhatKy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin NhatKy
 */
class NhatKyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doi_tuong_loai' => $this->doi_tuong_loai,
            'doi_tuong_loai_label' => $this->tenDoiTuongLoai(),
            'doi_tuong_id' => $this->doi_tuong_id,
            'hanh_dong' => $this->hanh_dong,
            'hanh_dong_label' => $this->tenHanhDong(),
            'gia_tri_cu' => $this->gia_tri_cu,
            'gia_tri_moi' => $this->gia_tri_moi,
            'ghi_chu' => $this->ghi_chu,
            'thoi_diem' => $this->thoi_diem?->toIso8601String(),
            'nguoi_thuc_hien' => $this->nguoiThucHien ? [
                'id' => $this->nguoiThucHien->id,
                'name' => $this->nguoiThucHien->name,
                'email' => $this->nguoiThucHien->email,
                'vai_tro' => $this->nguoiThucHien->vai_tro,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
