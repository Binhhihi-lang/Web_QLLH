<?php

namespace App\Http\Requests\DiemDanh;

use App\Models\BuoiHoc;
use App\Models\DiemDanh;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DiemDanhHangLoatRequest extends FormRequest
{
    public function authorize(): bool
    {
        $buoiHoc = $this->route('buoiHoc');
        if (! $buoiHoc instanceof BuoiHoc) {
            $buoiHoc = BuoiHoc::query()->find($buoiHoc);
        }

        if (! $buoiHoc) {
            return false;
        }

        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->laAdmin()) {
            return true;
        }

        return $user->laGiangVien()
            && $user->giangVien !== null
            && $buoiHoc->lopHocPhan->giang_vien_id === $user->giangVien->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'diem_danh' => ['required', 'array', 'min:1'],
            'diem_danh.*.dang_ky_hoc_phan_id' => ['required', 'integer', 'distinct', 'exists:dang_ky_hoc_phan,id'],
            'diem_danh.*.trang_thai' => ['required', 'string', Rule::in([
                DiemDanh::PRESENT,
                DiemDanh::ABSENT,
                DiemDanh::LATE,
                DiemDanh::EXCUSED,
            ])],
            'diem_danh.*.ghi_chu' => ['nullable', 'string', 'max:255'],
        ];
    }
}
