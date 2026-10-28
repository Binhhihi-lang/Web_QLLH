<?php

namespace App\Http\Requests\QuanLy;

use App\Models\Menu;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ten' => ['required', 'string', 'max:100'],
            'url' => [
                'required',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! $this->urlHopLe($value)) {
                        $fail('URL phải là đường dẫn nội bộ, fragment hoặc địa chỉ HTTP(S).');
                    }
                },
            ],
            'vi_tri' => ['required', 'string', Rule::in(array_keys(Menu::VI_TRI))],
            'nhom' => ['sometimes', 'nullable', 'string', 'max:100'],
            // Mảng vai trò được thấy mục; null/rỗng = mọi vai trò.
            'vai_tro' => ['sometimes', 'nullable', 'array'],
            'vai_tro.*' => [Rule::in(array_keys(Menu::VAI_TRO))],
            'thu_tu' => ['sometimes', 'integer'],
            'trang_thai' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Mảng rỗng và null cùng nghĩa "mọi vai trò" — chuẩn hóa về null để cột
        // không lưu hai kiểu biểu diễn khác nhau.
        if (is_array($this->input('vai_tro')) && $this->input('vai_tro') === []) {
            $this->merge(['vai_tro' => null]);
        }

        // Bỏ vai trò trùng lặp, giữ thứ tự xuất hiện.
        $vaiTro = $this->input('vai_tro');
        if (is_array($vaiTro)) {
            $this->merge(['vai_tro' => array_values(array_unique($vaiTro))]);
        }
    }

    private function urlHopLe(mixed $value): bool
    {
        if (! is_string($value) || preg_match('/[\x00-\x20\\\\]/', $value)) {
            return false;
        }

        if (str_starts_with($value, '/') && ! str_starts_with($value, '//')) {
            return true;
        }

        if (str_starts_with($value, '#')) {
            return true;
        }

        $scheme = parse_url($value, PHP_URL_SCHEME);

        return in_array(strtolower((string) $scheme), ['http', 'https'], true)
            && filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}
