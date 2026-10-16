<?php

namespace App\Http\Requests;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Checkbox không được gửi lên khi bỏ tick, nên chuẩn hóa về 0
     * để rule "required|boolean" không báo lỗi sai.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'trang_thai' => $this->boolean('trang_thai'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'ten' => 'required|string|max:100',
            // Rule regex có chứa dấu | nên phải viết dạng mảng thay vì chuỗi ngăn cách bằng |
            'url' => ['required', 'string', 'max:255', 'regex:/^(\/|#|https?:\/\/)/'],
            'vi_tri' => ['required', Rule::in(array_keys(Menu::VI_TRI))],
            'nhom' => 'nullable|string|max:100',
            // Để trống = mọi vai trò đều thấy menu này.
            'vai_tro' => ['nullable', Rule::in(array_keys(Menu::VAI_TRO))],
            'thu_tu' => 'required|integer|min:0',
            'trang_thai' => 'required|boolean',
        ];
    }

    /**
     * Thông báo lỗi tiếng Việt.
     */
    public function messages(): array
    {
        return [
            'required' => ':attribute không được để trống.',
            'string' => ':attribute phải là chuỗi ký tự.',
            'max' => ':attribute không được vượt quá :max ký tự.',
            'integer' => ':attribute phải là số nguyên.',
            'boolean' => ':attribute không hợp lệ.',
            'in' => ':attribute không hợp lệ.',
            'vai_tro.in' => 'Vai trò không hợp lệ.',
            'url.regex' => 'Đường dẫn phải bắt đầu bằng /, # hoặc http(s)://.',
            'thu_tu.min' => 'Thứ tự phải từ :min trở lên.',
        ];
    }

    /**
     * Tên hiển thị của các trường trong thông báo lỗi.
     */
    public function attributes(): array
    {
        return [
            'ten' => 'Tên menu',
            'url' => 'Đường dẫn',
            'vi_tri' => 'Vị trí',
            'nhom' => 'Nhóm',
            'vai_tro' => 'Vai trò',
            'thu_tu' => 'Thứ tự',
            'trang_thai' => 'Trạng thái',
        ];
    }
}
