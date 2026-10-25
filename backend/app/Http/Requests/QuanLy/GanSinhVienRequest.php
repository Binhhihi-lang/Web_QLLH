<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GanSinhVienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sinh_vien_ids' => ['required', 'array', 'min:1', 'max:500'],
            'sinh_vien_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('sinh_vien', 'id')->whereNull('deleted_at'),
            ],
        ];
    }
}
