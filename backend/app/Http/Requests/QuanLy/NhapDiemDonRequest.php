<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class NhapDiemDonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'diem_chuyen_can' => ['present', 'nullable', 'numeric', 'between:0,10'],
            'diem_giua_ky' => ['present', 'nullable', 'numeric', 'between:0,10'],
            'diem_cuoi_ky' => ['present', 'nullable', 'numeric', 'between:0,10'],
            'ly_do' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach (['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky'] as $truong) {
                    $diem = $this->input($truong);

                    if ($diem !== null && abs((float) $diem * 100 - round((float) $diem * 100)) > 0.00001) {
                        $validator->errors()->add($truong, 'Điểm chỉ được có tối đa hai chữ số thập phân.');
                    }
                }
            },
        ];
    }
}

