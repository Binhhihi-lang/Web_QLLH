<?php

namespace App\Http\Requests\QuanLy;

use App\Models\MonHoc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MonHocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var MonHoc|null $monHoc */
        $monHoc = $this->route('monHoc');

        return [
            'ma_mon' => ['required', 'string', 'max:20', Rule::unique('mon_hoc', 'ma_mon')->ignore($monHoc?->id)],
            'ten_mon' => ['required', 'string', 'max:255'],
            'so_tin_chi' => ['required', 'integer', 'between:1,10'],
            'mo_ta' => ['nullable', 'string'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
