<?php

namespace App\Http\Requests\QuanLy;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Mở khóa điểm của lớp đã chốt. Bắt buộc có lý do để ghi vào nhat_ky.
 */
class MoKhoaDiemRequest extends FormRequest
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
            'ly_do' => ['required', 'string', 'max:500'],
        ];
    }
}
