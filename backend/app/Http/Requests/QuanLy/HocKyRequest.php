<?php

namespace App\Http\Requests\QuanLy;

use App\Models\HocKy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HocKyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->laAdmin() ?? false;
    }

    public function rules(): array
    {
        /** @var HocKy|null $hocKy */
        $hocKy = $this->route('hocKy');

        return [
            'ma_hoc_ky' => ['required', 'string', 'max:20', Rule::unique('hoc_ky', 'ma_hoc_ky')->ignore($hocKy?->id)],
            'ten_hoc_ky' => ['required', 'string', 'max:255'],
            'nam_hoc' => ['required', 'string', 'regex:/^[0-9]{4}-[0-9]{4}$/'],
            'ky_thu' => [
                'required', 'integer', 'between:1,3',
                Rule::unique('hoc_ky', 'ky_thu')->where('nam_hoc', $this->input('nam_hoc'))->ignore($hocKy?->id),
            ],
            'ngay_bat_dau' => ['required', 'date_format:Y-m-d'],
            'ngay_ket_thuc' => ['required', 'date_format:Y-m-d', 'after:ngay_bat_dau'],
            'mo_dang_ky_luc' => ['required', 'date_format:Y-m-d H:i:s'],
            'dong_dang_ky_luc' => ['required', 'date_format:Y-m-d H:i:s', 'after:mo_dang_ky_luc'],
            // Chỉ endpoint /status được thay đổi trạng thái (BR-24).
            'trang_thai' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'ma_hoc_ky.unique' => 'Mã học kỳ đã tồn tại, kể cả học kỳ đã xóa.',
            'ky_thu.unique' => 'Năm học này đã có kỳ thứ được chọn.',
            'nam_hoc.regex' => 'Năm học phải có dạng YYYY-YYYY, ví dụ 2026-2027.',
            'trang_thai.prohibited' => 'Hãy dùng API chuyển trạng thái; học kỳ mới luôn là UPCOMING.',
        ];
    }
}
