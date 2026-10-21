<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateTaiKhoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Giảng viên tự sửa tài khoản: chỉ được đổi tên, email và mật khẩu.
     * Không được đổi vai trò hay trạng thái của chính mình.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            'mat_khau_hien_tai' => 'nullable|string',
            'password' => ['nullable', 'confirmed', Password::min(6)],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => ':attribute không được để trống.',
            'string' => ':attribute phải là chuỗi ký tự.',
            'max' => ':attribute không được vượt quá :max ký tự.',
            'email.email' => ':attribute không đúng định dạng.',
            'email.unique' => 'Email này đã được sử dụng.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
            'password.min' => 'Mật khẩu phải có ít nhất :min ký tự.',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Họ tên',
            'email' => 'Email',
            'mat_khau_hien_tai' => 'Mật khẩu hiện tại',
            'password' => 'Mật khẩu mới',
        ];
    }
}
