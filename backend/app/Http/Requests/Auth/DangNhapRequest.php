<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class DangNhapRequest extends FormRequest
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
            'email' => ['required_without:ma_sv', 'prohibits:ma_sv', 'email', 'max:255'],
            'ma_sv' => ['required_without:email', 'prohibits:email', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',
            'ma_sv.required_without' => 'Vui lòng nhập email hoặc mã sinh viên.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
        ];
    }
}
