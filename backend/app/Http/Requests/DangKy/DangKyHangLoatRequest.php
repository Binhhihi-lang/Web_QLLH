<?php

namespace App\Http\Requests\DangKy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DangKyHangLoatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'lop_hoc_phan_id' => ['required', 'integer', 'exists:lop_hoc_phan,id'],
            'sinh_vien_ids' => ['required_without:lop_hanh_chinh_id', 'array', 'min:1', 'max:500'],
            'sinh_vien_ids.*' => ['required', 'integer', 'distinct'],
            'lop_hanh_chinh_id' => ['required_without:sinh_vien_ids', 'integer', 'exists:lop_hanh_chinh,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->filled('sinh_vien_ids') && $this->filled('lop_hanh_chinh_id')) {
                $validator->errors()->add('sinh_vien_ids', 'Chỉ chọn danh sách sinh viên hoặc lớp hành chính.');
            }
        });
    }
}
