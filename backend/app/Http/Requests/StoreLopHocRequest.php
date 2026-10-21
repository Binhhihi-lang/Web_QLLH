<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLopHocRequest extends FormRequest
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
            'ten_lop' => 'required|string|max:255',
            'ma_lop' => 'required|string|max:6|unique:lop_hocs,ma_lop',
            'giao_vien' => 'required|string|max:255',
            'so_dien_thoai_gvcn' => 'nullable|string|max:20',
            'ghi_chu' => 'nullable|string|max:500',
            'si_so' => 'required|integer|min:1',
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
            'ma_lop.unique' => 'Mã lớp này đã tồn tại.',
            'si_so.min' => 'Sĩ số phải từ :min trở lên.',
        ];
    }

    /**
     * Tên hiển thị của các trường trong thông báo lỗi.
     */
    public function attributes(): array
    {
        return [
            'ten_lop' => 'Tên lớp',
            'ma_lop' => 'Mã lớp',
            'giao_vien' => 'Giáo viên',
            'so_dien_thoai_gvcn' => 'Số điện thoại GVCN',
            'ghi_chu' => 'Ghi chú',
            'si_so' => 'Sĩ số',
            'trang_thai' => 'Trạng thái',
        ];
    }
}
