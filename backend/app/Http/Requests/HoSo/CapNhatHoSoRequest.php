<?php

namespace App\Http\Requests\HoSo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `PUT /api/me` — sửa hồ sơ cá nhân (FR-01.06).
 *
 * Mỗi vai trò chỉ sửa được trường của mình; trường không thuộc vai trò bị bỏ qua
 * vì `validated()` chỉ trả các khoá có trong `rules()`.
 */
class CapNhatHoSoRequest extends FormRequest
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
        $nguoiDung = $this->user();

        if ($nguoiDung->laAdmin()) {
            return [
                'name' => ['sometimes', 'string', 'max:255'],
                'email' => [
                    'sometimes',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($nguoiDung->id),
                ],
            ];
        }

        if ($nguoiDung->laGiangVien()) {
            return [
                'so_dien_thoai' => ['sometimes', 'nullable', 'string', 'max:20'],
            ];
        }

        return [
            'so_dien_thoai' => ['sometimes', 'nullable', 'string', 'max:20'],
            'dia_chi' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
