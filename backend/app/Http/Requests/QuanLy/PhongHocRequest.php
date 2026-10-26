<?php

namespace App\Http\Requests\QuanLy;

use App\Models\PhongHoc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PhongHocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var PhongHoc|null $phongHoc */
        $phongHoc = $this->route('phongHoc');

        return [
            'ma_phong' => ['required', 'string', 'max:20', Rule::unique('phong_hoc', 'ma_phong')->ignore($phongHoc?->id)],
            'ten_phong' => ['required', 'string', 'max:255'],
            'suc_chua' => ['required', 'integer', 'min:1', 'max:65535'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
