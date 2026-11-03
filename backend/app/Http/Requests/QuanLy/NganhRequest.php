<?php

namespace App\Http\Requests\QuanLy;

use App\Models\Nganh;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Danh mục Ngành (ADR-020). Ngành luôn thuộc đúng một khoa.
 */
class NganhRequest extends FormRequest
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
        /** @var Nganh|null $nganh */
        $nganh = $this->route('nganh');

        return [
            'khoa_id' => ['required', 'integer', Rule::exists('khoa', 'id')->whereNull('deleted_at')],
            'ma_nganh' => [
                'required', 'string', 'max:20',
                Rule::unique('nganh', 'ma_nganh')->ignore($nganh?->id),
            ],
            'ten_nganh' => [
                'required', 'string', 'max:255',
                // Trong cùng một khoa không được trùng tên ngành — khớp unique của bảng.
                Rule::unique('nganh', 'ten_nganh')
                    ->where(fn ($truyVan) => $truyVan->where('khoa_id', $this->input('khoa_id')))
                    ->ignore($nganh?->id),
            ],
            'mo_ta' => ['nullable', 'string'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }
}
