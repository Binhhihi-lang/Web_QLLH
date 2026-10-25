<?php

namespace App\Http\Requests\QuanLy;

use App\Models\SinhVien;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SinhVienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var SinhVien|null $sinhVien */
        $sinhVien = $this->route('sinhVien');

        return [
            'ma_sv' => ['required', 'string', 'max:50', Rule::unique('sinh_vien', 'ma_sv')->ignore($sinhVien?->id)],
            'ho_ten' => ['required', 'string', 'max:255'],
            'ngay_sinh' => ['nullable', 'date_format:Y-m-d'],
            'gioi_tinh' => ['sometimes', 'boolean'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($sinhVien?->user_id),
                Rule::unique('sinh_vien', 'email')->ignore($sinhVien?->id),
            ],
            'so_dien_thoai' => ['nullable', 'string', 'max:20'],
            'dia_chi' => ['nullable', 'string'],
            'lop_hanh_chinh_id' => [
                'nullable',
                'integer',
                Rule::exists('lop_hanh_chinh', 'id')->whereNull('deleted_at'),
            ],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
