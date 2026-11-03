<?php

namespace App\Http\Resources;

use App\Models\LopHocPhan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LopHocPhan
 */
class LopHocPhanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_lop_hp' => $this->ma_lop_hp,
            'mon_hoc' => $this->whenLoaded('monHoc', fn () => $this->monHoc === null ? null : [
                'id' => $this->monHoc->id,
                'ma_mon' => $this->monHoc->ma_mon,
                'ten_mon' => $this->monHoc->ten_mon,
                'so_tin_chi' => $this->monHoc->so_tin_chi,
            ]),
            'hoc_ky' => $this->whenLoaded('hocKy', fn () => $this->hocKy === null ? null : [
                'id' => $this->hocKy->id,
                'ma_hoc_ky' => $this->hocKy->ma_hoc_ky,
                'ten_hoc_ky' => $this->hocKy->ten_hoc_ky,
                'nam_hoc' => $this->hocKy->nam_hoc,
                'ky_thu' => $this->hocKy->ky_thu,
                'trang_thai' => $this->hocKy->trang_thai,
            ]),
            'giang_vien' => $this->whenLoaded('giangVien', fn () => $this->giangVien === null ? null : [
                'id' => $this->giangVien->id,
                'ma_gv' => $this->giangVien->ma_gv,
                'ho_ten' => $this->giangVien->ho_ten,
            ]),
            'si_so_toi_da' => $this->si_so_toi_da,
            'si_so_hien_tai' => $this->siSoHienTai(),
            'con_cho' => max(0, $this->si_so_toi_da - $this->siSoHienTai()),
            'nam_thu' => $this->nam_thu,
            'trang_thai' => $this->trang_thai,
            'da_chot_diem' => $this->daChotDiem(),
            'chot_diem_luc' => $this->chot_diem_luc?->format('Y-m-d H:i:s'),
            'da_xoa' => $this->trashed(),
        ];
    }

    /**
     * Danh sách dùng `withCount` để tránh N+1; chi tiết thì đếm trực tiếp.
     * Sĩ số không lưu thành cột để không lệch với bảng đăng ký (xem model).
     */
    private function siSoHienTai(): int
    {
        $dem = $this->resource->getAttribute('dang_ky_active_count');

        return $dem === null ? $this->resource->siSoHienTai() : (int) $dem;
    }
}
