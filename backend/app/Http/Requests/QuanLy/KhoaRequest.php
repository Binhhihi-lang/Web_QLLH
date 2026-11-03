<?php

namespace App\Http\Requests\QuanLy;

use App\Models\Khoa;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Danh mục Khoa (ADR-020).
 */
class KhoaRequest extends FormRequest
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
        /** @var Khoa|null $khoa */
        $khoa = $this->route('khoa');

        return [
            'ma_khoa' => [
                'required', 'string', 'max:20',
                // Mã khoa duy nhất, kể cả bản ghi xóa mềm (BR-01).
                Rule::unique('khoa', 'ma_khoa')->ignore($khoa?->id),
            ],
            'ten_khoa' => ['required', 'string', 'max:255'],
            'mo_ta' => ['nullable', 'string'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
