<?php

namespace App\Http\Requests\QuanLy;

use App\Models\DangKyHocPhan;
use App\Models\LopHocPhan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CapNhatDiemHangLoatRequest extends FormRequest
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
        /** @var LopHocPhan|null $lop */
        $lop = $this->route('lopHocPhan');

        return [
            'diem' => ['required', 'array', 'min:1'],
            'ly_do' => ['nullable', 'string', 'max:500'],
            'diem.*' => ['required', 'array:dang_ky_hoc_phan_id,diem_chuyen_can,diem_giua_ky,diem_cuoi_ky'],
            'diem.*.dang_ky_hoc_phan_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('dang_ky_hoc_phan', 'id')
                    ->where('lop_hoc_phan_id', $lop?->id)
                    ->where('trang_thai', DangKyHocPhan::ACTIVE),
            ],
            'diem.*.diem_chuyen_can' => ['present', 'nullable', 'numeric', 'between:0,10'],
            'diem.*.diem_giua_ky' => ['present', 'nullable', 'numeric', 'between:0,10'],
            'diem.*.diem_cuoi_ky' => ['present', 'nullable', 'numeric', 'between:0,10'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ($this->input('diem', []) as $index => $dong) {
                    foreach (['diem_chuyen_can', 'diem_giua_ky', 'diem_cuoi_ky'] as $truong) {
                        $diem = $dong[$truong] ?? null;

                        if ($diem !== null && abs((float) $diem * 100 - round((float) $diem * 100)) > 0.00001) {
                            $validator->errors()->add("diem.{$index}.{$truong}", 'Điểm chỉ được có tối đa hai chữ số thập phân.');
                        }
                    }
                }
            },
        ];
    }
}
