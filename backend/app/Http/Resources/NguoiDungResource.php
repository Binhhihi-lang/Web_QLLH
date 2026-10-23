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
            return [
                'loai' => 'sinh_vien',
                'id' => $this->sinhVien->id,
                'ma_sv' => $this->sinhVien->ma_sv,
                'ho_ten' => $this->sinhVien->ho_ten,
                'lop_hanh_chinh_id' => $this->sinhVien->lop_hanh_chinh_id,
            ];
        }

        if ($this->relationLoaded('giangVien') && $this->giangVien !== null) {
            return [
                'loai' => 'giang_vien',
                'id' => $this->giangVien->id,
                'ma_gv' => $this->giangVien->ma_gv,
                'ho_ten' => $this->giangVien->ho_ten,
                'chuyen_mon' => $this->giangVien->chuyen_mon,
            ];
        }

        return null;
    }
}
