<?php

namespace App\Http\Requests\QuanLy;

use App\Models\LopHanhChinh;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LopHanhChinhRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var LopHanhChinh|null $lopHanhChinh */
        $lopHanhChinh = $this->route('lopHanhChinh');

        return [
            'ma_lop' => ['required', 'string', 'max:20', Rule::unique('lop_hanh_chinh', 'ma_lop')->ignore($lopHanhChinh?->id)],
            'ten_lop' => ['required', 'string', 'max:255'],
            'khoa_hoc' => ['nullable', 'string', 'max:20'],
            'nganh' => ['nullable', 'string', 'max:20'],
            'nam_nhap_hoc' => ['nullable', 'integer', 'between:1900,2100'],
            'mo_ta' => ['nullable', 'string'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
