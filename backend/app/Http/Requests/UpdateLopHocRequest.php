<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateLopHocRequest extends StoreLopHocRequest
{
    /**
     * Giống lúc thêm mới, chỉ khác: mã lớp được phép trùng với chính lớp đang sửa.
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'ma_lop' => [
                'required',
                'string',
                'max:6',
                Rule::unique('lop_hocs', 'ma_lop')->ignore($this->route('lop_hoc')),
            ],
        ]);
    }
}
