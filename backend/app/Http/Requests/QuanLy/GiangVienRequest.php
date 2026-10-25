<?php

namespace App\Http\Requests\QuanLy;

use App\Models\GiangVien;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GiangVienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var GiangVien|null $giangVien */
        $giangVien = $this->route('giangVien');

        if ($this->user()?->laGiangVien()) {
            return [
                'so_dien_thoai' => ['present', 'nullable', 'string', 'max:20'],
                'ma_gv' => ['prohibited'],
                'ho_ten' => ['prohibited'],
                'email' => ['prohibited'],
                'chuyen_mon' => ['prohibited'],
                'trang_thai' => ['prohibited'],
            ];
        }

        return [
            'ma_gv' => ['required', 'string', 'max:50', Rule::unique('giang_vien', 'ma_gv')->ignore($giangVien?->id)],
            'ho_ten' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($giangVien?->user_id),
                Rule::unique('giang_vien', 'email')->ignore($giangVien?->id),
            ],
            'so_dien_thoai' => ['nullable', 'string', 'max:20'],
            'chuyen_mon' => ['nullable', 'string', 'max:255'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
