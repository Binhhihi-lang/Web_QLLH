<?php

namespace App\Http\Resources;

use App\Models\GiangVien;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Thông tin liên hệ của giảng viên cho sinh viên — dùng ở popup khi bấm tên
 * giảng viên trên lịch. Không trả trạng thái tài khoản hay dữ liệu nội bộ.
 *
 * @mixin GiangVien
 */
class GiangVienLienHeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ma_gv' => $this->ma_gv,
            'ho_ten' => $this->ho_ten,
            'email' => $this->email,
            'so_dien_thoai' => $this->so_dien_thoai,
            'avatar_url' => $this->user?->avatar_url,
        ];
    }
}
