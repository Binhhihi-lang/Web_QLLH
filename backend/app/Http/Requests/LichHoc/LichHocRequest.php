<?php

namespace App\Http\Requests\LichHoc;

use App\Models\BuoiHoc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LichHocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->laAdmin() || $this->user()?->laGiangVien() || $this->user()?->laSinhVien();
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'in:10,25,50,100'],
            'sort_by' => ['sometimes', 'in:id,ngay_hoc,gio_bat_dau,gio_ket_thuc,trang_thai'],
            'sort_dir' => ['sometimes', 'in:asc,desc'],
            'hoc_ky_id' => ['sometimes', 'integer', 'min:1'],
            'giang_vien_id' => ['sometimes', 'integer', 'min:1'],
            'phong_hoc_id' => ['sometimes', 'integer', 'min:1'],
            'tu_ngay' => ['sometimes', 'date_format:Y-m-d'],
            'den_ngay' => ['sometimes', 'date_format:Y-m-d', ...($this->filled('tu_ngay') ? ['after_or_equal:tu_ngay'] : [])],
            'trang_thai' => ['sometimes', Rule::in([BuoiHoc::SCHEDULED, BuoiHoc::DONE, BuoiHoc::CANCELLED])],
        ];
    }
}
