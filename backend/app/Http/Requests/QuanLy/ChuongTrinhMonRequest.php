<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Môn trong chương trình đào tạo. Một request dùng cho hai thao tác:
 * - POST `curriculums/{chuongTrinh}/subjects`: thêm nhiều môn (`mon_hoc_ids`).
 * - PUT `curriculums/{chuongTrinh}/subjects/{mon}`: sửa kỳ thứ / bắt buộc.
 */
class ChuongTrinhMonRequest extends FormRequest
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
        if ($this->isMethod('PUT')) {
            return [
                // null = môn chưa gán kỳ, sinh viên chưa thấy khi đăng ký (cột cho phép null).
                'ky_thu' => ['sometimes', 'nullable', 'integer', 'between:1,10'],
                'bat_buoc' => ['sometimes', 'boolean'],
            ];
        }

        return [
            'mon_hoc_ids' => ['required', 'array', 'min:1', 'max:200'],
            'mon_hoc_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('mon_hoc', 'id')->whereNull('deleted_at'),
            ],
            'ky_thu' => ['sometimes', 'nullable', 'integer', 'between:1,10'],
            'bat_buoc' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mon_hoc_ids.required' => 'Vui lòng chọn ít nhất một môn học.',
            'mon_hoc_ids.min' => 'Vui lòng chọn ít nhất một môn học.',
            'mon_hoc_ids.max' => 'Mỗi lần chỉ thêm tối đa :max môn.',
            'mon_hoc_ids.*.integer' => 'Mã môn học không hợp lệ.',
            'mon_hoc_ids.*.distinct' => 'Danh sách môn học bị trùng.',
            'mon_hoc_ids.*.exists' => 'Môn học đã chọn không tồn tại.',
            'ky_thu.between' => 'Kỳ thứ phải nằm trong khoảng :min–:max.',
        ];
    }
}
