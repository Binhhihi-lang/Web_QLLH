<?php

namespace App\Http\Requests;

use App\Models\SinhVien;
use Illuminate\Validation\Rule;

class UpdateSinhVienRequest extends StoreSinhVienRequest
{
    /**
     * Giống lúc thêm mới, chỉ khác: mã sinh viên và email được phép
     * trùng với chính sinh viên đang sửa.
     *
     * Route web dùng tham số {id}, route API dùng {sinh_vien} (đã bind model),
     * nên cần lấy id theo cả hai cách.
     */
    public function rules(): array
    {
        $sinhVien = $this->route('sinh_vien') ?? $this->route('id');
        $id = $sinhVien instanceof SinhVien ? $sinhVien->getKey() : $sinhVien;

        return array_merge(parent::rules(), [
            'ma_sv' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sinh_viens', 'ma_sv')->ignore($id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('sinh_viens', 'email')->ignore($id),
            ],
        ]);
    }
}
