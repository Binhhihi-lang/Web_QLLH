<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Import môn vào chương trình đào tạo (BR-31).
 *
 * `ma_mon` phải có trong chuỗi nhưng KHÔNG kiểm tồn tại ở đây: dòng có mã lạ
 * phải được service trả về như lỗi riêng của dòng đó, không làm hỏng cả lần import.
 */
class ImportChuongTrinhRequest extends FormRequest
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
            'rows' => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.ma_mon' => ['required', 'string', 'max:20'],
            'rows.*.ky_thu' => ['sometimes', 'nullable', 'integer', 'between:1,10'],
            'rows.*.bat_buoc' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rows.required' => 'Vui lòng gửi danh sách dòng cần import.',
            'rows.min' => 'Danh sách import phải có ít nhất một dòng.',
            'rows.max' => 'Mỗi lần chỉ import tối đa :max dòng.',
            'rows.*.ma_mon.required' => 'Mỗi dòng phải có mã môn.',
            'rows.*.ky_thu.between' => 'Kỳ thứ phải nằm trong khoảng :min–:max.',
        ];
    }
}
