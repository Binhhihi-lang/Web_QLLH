<?php

namespace App\Http\Requests\QuanLy;

use App\Models\LopHocPhan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * FR-08.04 — chuyển trạng thái lớp học phần: OPEN / CLOSED / CANCELLED.
 */
class TrangThaiLopRequest extends FormRequest
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
            'trang_thai' => ['required', Rule::in([
                LopHocPhan::OPEN,
                LopHocPhan::CLOSED,
                LopHocPhan::CANCELLED,
            ])],
        ];
    }
}
