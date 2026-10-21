<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateNguoiDungRequest extends StoreNguoiDungRequest
{
    /**
     * Giống lúc thêm mới, chỉ khác: email được phép trùng với chính
     * tài khoản đang sửa, và mật khẩu để trống nghĩa là giữ nguyên.
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('nguoi_dung')),
            ],
            'password' => ['nullable', 'confirmed', Password::min(6)],
        ]);
    }
}
