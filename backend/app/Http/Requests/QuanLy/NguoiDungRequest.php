<?php

namespace App\Http\Requests\QuanLy;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Quản lý tài khoản người dùng (docs/04-api-contract.md §3).
 */
class NguoiDungRequest extends FormRequest
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
        /** @var User|null $nguoiDung */
        $nguoiDung = $this->route('nguoiDung');
        $laCapNhat = $nguoiDung !== null;

        return [
            'name' => [$laCapNhat ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => [
                $laCapNhat ? 'sometimes' : 'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($nguoiDung?->id),
            ],
            'vai_tro' => [
                $laCapNhat ? 'sometimes' : 'required',
                Rule::in(array_keys(User::VAI_TRO)),
            ],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
