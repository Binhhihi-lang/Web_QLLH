<?php

namespace App\Http\Resources;

use App\Models\ChuongTrinhDaoTao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ChuongTrinhDaoTao
 *
 * `so_mon`, `tong_tin_chi`, `so_sinh_vien` có ở cả danh sách (subquery) lẫn chi
 * tiết (service tính rồi gắn thuộc tính). Ba chỉ số `so_bat_buoc`, `so_tu_chon`,
 * `so_mon_chua_gan_ky` chỉ có ở chi tiết nên xuất hiện có điều kiện.
 */
class ChuongTrinhDaoTaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_ctdt' => $this->ma_ctdt,
            'nganh_id' => $this->nganh_id,
            'nganh' => $this->whenLoaded('nganh', fn () => $this->nganh === null ? null : [
                'id' => $this->nganh->id,
                'ma_nganh' => $this->nganh->ma_nganh,
                'ten_nganh' => $this->nganh->ten_nganh,
                'khoa_id' => $this->nganh->khoa_id,
            ]),
            // `whenLoaded` không hiểu đường dẫn lồng — controller eager load 'nganh.khoa'.
            'khoa' => $this->whenLoaded('nganh', fn () => $this->nganh?->khoa === null ? null : [
                'id' => $this->nganh->khoa->id,
                'ma_khoa' => $this->nganh->khoa->ma_khoa,
                'ten_khoa' => $this->nganh->khoa->ten_khoa,
            ]),
            'khoa_hoc' => $this->khoa_hoc,
            'ma_lop_hanh_chinh_goi_y' => $this->when(
                $this->ma_lop_hanh_chinh_goi_y !== null,
                $this->ma_lop_hanh_chinh_goi_y,
            ),
            'ten' => $this->ten,
            'so_nam' => (float) ($this->so_nam ?? 4.0),
            'so_ky' => (int) ($this->so_ky ?? 8),
            'mo_ta' => $this->mo_ta,
            'trang_thai' => $this->trang_thai,
            'so_mon' => (int) ($this->mon_count ?? 0),
            'tong_tin_chi' => (int) ($this->tong_tin_chi ?? 0),
            'so_sinh_vien' => (int) ($this->so_sinh_vien ?? 0),
            'so_bat_buoc' => $this->when($this->so_bat_buoc !== null, (int) $this->so_bat_buoc),
            'so_tu_chon' => $this->when($this->so_tu_chon !== null, (int) $this->so_tu_chon),
            'so_mon_chua_gan_ky' => $this->when(
                $this->so_mon_chua_gan_ky !== null,
                (int) $this->so_mon_chua_gan_ky,
            ),
            'mon' => ChuongTrinhMonResource::collection($this->whenLoaded('mon')),
            'da_xoa' => $this->trashed(),
        ];
    }
}
