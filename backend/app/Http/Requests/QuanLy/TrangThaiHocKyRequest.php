<?php

namespace App\Http\Requests\QuanLy;

use App\Models\HocKy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TrangThaiHocKyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->laAdmin() ?? false;
    }

    public function rules(): array
    {
        return ['trang_thai' => ['required', Rule::in([HocKy::UPCOMING, HocKy::ONGOING, HocKy::CLOSED])]];
    }
}
