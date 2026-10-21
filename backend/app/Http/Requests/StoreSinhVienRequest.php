<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSinhVienRequest extends FormRequest
{
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

    public function rules(): array
    {
        return [
            'ma_sv'         => 'required|string|max:50|unique:sinh_viens,ma_sv',
            'ho_ten'        => 'required|string|max:255',
            'email'         => 'required|email|max:255|unique:sinh_viens,email',
            'ngay_sinh'     => 'nullable|date',
            'gioi_tinh'     => 'required|boolean',
            'lop_hoc_id'    => 'nullable|exists:lop_hocs,id',
            'so_dien_thoai' => 'nullable|string|max:20',
            'dia_chi'       => 'nullable|string',
            'trang_thai'    => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => ':attribute không được để trống.',
            'string' => ':attribute phải là chuỗi ký tự.',
            'max' => ':attribute không được vượt quá :max ký tự.',
            'boolean' => ':attribute không hợp lệ.',
            'date' => ':attribute không đúng định dạng ngày.',
            'email' => ':attribute không đúng định dạng.',
            'ma_sv.unique' => 'Mã sinh viên này đã tồn tại.',
            'email.unique' => 'Email này đã tồn tại.',
            'lop_hoc_id.exists' => 'Lớp học không tồn tại.',
        ];
    }

    /**
     * Tên hiển thị của các trường trong thông báo lỗi.
     */
    public function attributes(): array
    {
        return [
            'ma_sv'         => 'Mã sinh viên',
            'ho_ten'        => 'Họ tên',
            'email'         => 'Email',
            'ngay_sinh'     => 'Ngày sinh',
            'gioi_tinh'     => 'Giới tính',
            'lop_hoc_id'    => 'Lớp học',
            'so_dien_thoai' => 'Số điện thoại',
            'dia_chi'       => 'Địa chỉ',
            'trang_thai'    => 'Trạng thái',
        ];
    }
}
