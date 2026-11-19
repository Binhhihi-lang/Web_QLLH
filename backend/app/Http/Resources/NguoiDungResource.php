<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class NguoiDungResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'vai_tro' => $this->vai_tro,
            'trang_thai' => $this->trang_thai,
            'must_change_password' => $this->must_change_password,
            'ho_so' => $this->hoSo(),
        ];
    }

    /**
     * Hồ sơ sinh viên hoặc giảng viên gắn với tài khoản. ADMIN không có hồ sơ.
     *
     * @return array<string, mixed>|null
     */
    private function hoSo(): ?array
    {
        if ($this->relationLoaded('sinhVien') && $this->sinhVien !== null) {
            $sv = $this->sinhVien;
            $lhc = $sv->relationLoaded('lopHanhChinh') ? $sv->lopHanhChinh : null;
            $nganh = $lhc && $lhc->relationLoaded('nganh') ? $lhc->nganh : null;

            return [
                'loai' => 'sinh_vien',
                'id' => $sv->id,
                'ma_sv' => $sv->ma_sv,
                'ho_ten' => $sv->ho_ten,
                'lop_hanh_chinh_id' => $sv->lop_hanh_chinh_id,
                'ma_lop' => $lhc?->ma_lop,
                'ten_lop' => $lhc?->ten_lop,
                'khoa_hoc' => $lhc?->khoa_hoc,
                'nam_nhap_hoc' => $lhc?->nam_nhap_hoc,
                'ma_nganh' => $nganh?->ma_nganh,
                'ten_nganh' => $nganh?->ten_nganh,
            ];
        }

        if ($this->relationLoaded('giangVien') && $this->giangVien !== null) {
            return [
                'loai' => 'giang_vien',
                'id' => $this->giangVien->id,
                'ma_gv' => $this->giangVien->ma_gv,
                'ho_ten' => $this->giangVien->ho_ten,
                'nganh_id' => $this->giangVien->nganh_id,
            ];
        }

        return null;
    }
}
