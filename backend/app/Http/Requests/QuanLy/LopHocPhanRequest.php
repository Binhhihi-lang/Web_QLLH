<?php

namespace App\Http\Requests\QuanLy;

use App\Models\DangKyHocPhan;
use App\Models\GiangVien;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * FR-08.01 (mở lớp) và FR-08.05 (kiểm tra hợp lệ).
 *
 * Các kiểm tra thuộc nhóm "tính hợp lệ của dữ liệu" trả 422 như mọi lỗi validate.
 * Các kiểm tra nghiệp vụ có mã lỗi riêng trong bảng ma_loi (SUBJECT_CHANGE_BLOCKED,
 * SEMESTER_CHANGE_BLOCKED, SCHEDULE_CONFLICT, SEMESTER_CLOSED) nằm ở
 * QuanLyLopHocPhanService và trả 409.
 */
class LopHocPhanRequest extends FormRequest
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
        /** @var LopHocPhan|null $lopHocPhan */
        $lopHocPhan = $this->route('lopHocPhan');
        $hocKyId = $this->input('hoc_ky_id', $lopHocPhan?->hoc_ky_id);

        return [
            'ma_lop_hp' => [
                'required', 'string', 'max:30',
                // Mã lớp duy nhất trong phạm vi học kỳ, kể cả bản ghi đã xóa mềm:
                // cột unique của bảng cố ý không lọc deleted_at (BR-01).
                Rule::unique('lop_hoc_phan', 'ma_lop_hp')
                    ->where(fn ($truyVan) => $truyVan->where('hoc_ky_id', $hocKyId))
                    ->ignore($lopHocPhan?->id),
            ],
            'mon_hoc_id' => ['required', 'integer', Rule::exists('mon_hoc', 'id')->whereNull('deleted_at')],
            'hoc_ky_id' => ['required', 'integer', Rule::exists('hoc_ky', 'id')->whereNull('deleted_at')],
            'giang_vien_id' => ['required', 'integer', Rule::exists('giang_vien', 'id')->whereNull('deleted_at')],
            'si_so_toi_da' => ['required', 'integer', 'between:1,1000'],
            // null = lớp phục vụ mọi năm thứ (BR-23).
            'nam_thu' => ['nullable', 'integer', 'between:1,6'],
            'trang_thai' => ['sometimes', Rule::in([
                LopHocPhan::OPEN,
                LopHocPhan::CLOSED,
                LopHocPhan::CANCELLED,
            ])],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $kiemTra): void {
                $this->kiemTraMonVaGiangVienHoatDong($kiemTra);
                $this->kiemTraSiSoKhongGiamDuoiDangKy($kiemTra);
            },
        ];
    }

    private function kiemTraMonVaGiangVienHoatDong(Validator $kiemTra): void
    {
        $monHoc = MonHoc::query()->find($this->input('mon_hoc_id'));

        if ($monHoc !== null && ! $monHoc->trang_thai) {
            $kiemTra->errors()->add('mon_hoc_id', 'Môn học đang ở trạng thái ngừng hoạt động.');
        }

        $giangVien = GiangVien::query()->find($this->input('giang_vien_id'));

        if ($giangVien !== null && ! $giangVien->trang_thai) {
            $kiemTra->errors()->add('giang_vien_id', 'Giảng viên đang ở trạng thái ngừng hoạt động.');
        }
    }

    /**
     * FR-08.05: không giảm sĩ số tối đa xuống dưới số đăng ký ACTIVE hiện có.
     */
    private function kiemTraSiSoKhongGiamDuoiDangKy(Validator $kiemTra): void
    {
        /** @var LopHocPhan|null $lopHocPhan */
        $lopHocPhan = $this->route('lopHocPhan');

        if ($lopHocPhan === null || ! $this->filled('si_so_toi_da')) {
            return;
        }

        $daDangKy = $lopHocPhan->dangKyHocPhan()
            ->where('trang_thai', DangKyHocPhan::ACTIVE)
            ->count();

        if ($this->integer('si_so_toi_da') < $daDangKy) {
            $kiemTra->errors()->add(
                'si_so_toi_da',
                "Sĩ số tối đa không được nhỏ hơn số đăng ký hiện tại ({$daDangKy}).",
            );
        }
    }
}
