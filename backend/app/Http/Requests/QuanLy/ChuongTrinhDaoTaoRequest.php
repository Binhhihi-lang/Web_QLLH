<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Chương trình đào tạo (một ngành × một khóa).
 *
 * Không kiểm duy nhất ở đây: unique `(nganh_id, khoa_hoc)` và `ma_ctdt` phủ cả
 * bản ghi đã xóa mềm, và service trả `DUPLICATE_CODE` để FE hiện một thông báo
 * nghiệp vụ thay vì lỗi từng trường.
 */
class ChuongTrinhDaoTaoRequest extends FormRequest
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
            'ma_ctdt' => ['required', 'string', 'max:30'],
            'nganh_id' => ['required', 'integer', Rule::exists('nganh', 'id')->whereNull('deleted_at')],
            // Cùng từ vựng với `lop_hanh_chinh.khoa_hoc` ('K68').
            'khoa_hoc' => ['required', 'string', 'max:20'],
            'ten' => ['required', 'string', 'max:255'],
            'so_nam' => ['sometimes', 'numeric', 'min:1', 'max:10'],
            'so_ky' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'mo_ta' => ['nullable', 'string'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ma_ctdt.required' => 'Vui lòng nhập mã chương trình đào tạo.',
            'ma_ctdt.max' => 'Mã chương trình đào tạo tối đa :max ký tự.',
            'nganh_id.required' => 'Vui lòng chọn ngành.',
            'nganh_id.exists' => 'Ngành đã chọn không tồn tại.',
            'khoa_hoc.required' => 'Vui lòng nhập khóa học.',
            'ten.required' => 'Vui lòng nhập tên chương trình đào tạo.',
        ];
    }
}
