<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\HocKy;
use App\Models\NhatKy;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuanLyHocKyService
{
    public function tao(array $duLieu): HocKy
    {
        return DB::transaction(function () use ($duLieu) {
            $cacKy = $this->khoaDanhSach();
            $this->kiemTraDuLieu($duLieu, $cacKy);

            return HocKy::query()->create([...$duLieu, 'trang_thai' => HocKy::UPCOMING]);
        }, 3);
    }

    public function capNhat(HocKy $hocKy, array $duLieu): HocKy
    {
        return DB::transaction(function () use ($hocKy, $duLieu) {
            $cacKy = $this->khoaDanhSach();
            $hocKy = $cacKy->find($hocKy->id);
            abort_if($hocKy === null || $hocKy->trashed(), 404);

            if ($hocKy->trang_thai === HocKy::CLOSED) {
                throw new LoiNghiepVu('SEMESTER_CLOSED', 'Học kỳ đã đóng, chỉ đọc.');
            }

            $this->kiemTraDuLieu($duLieu, $cacKy, $hocKy->id);

            // Thu hẹp khoảng ngày của kỳ không được làm buổi học đã có nằm ngoài kỳ.
            $coBuoiNgoaiKy = BuoiHoc::query()
                ->whereHas('lopHocPhan', fn ($query) => $query->where('hoc_ky_id', $hocKy->id))
                ->where(fn ($query) => $query
                    ->whereDate('ngay_hoc', '<', $duLieu['ngay_bat_dau'])
                    ->orWhereDate('ngay_hoc', '>', $duLieu['ngay_ket_thuc']))
                ->exists();

            if ($coBuoiNgoaiKy) {
                throw new LoiNghiepVu('SESSION_OUTSIDE_SEMESTER', 'Khoảng ngày mới không bao phủ các buổi học đã có.');
            }

            $hocKy->update($duLieu);

            return $hocKy->fresh();
        }, 3);
    }

    public function doiTrangThai(HocKy $hocKy, string $trangThai, int $nguoiThucHienId): HocKy
    {
        return DB::transaction(function () use ($hocKy, $trangThai, $nguoiThucHienId) {
            $cacKy = $this->khoaDanhSach();
            $hocKy = $cacKy->find($hocKy->id);
            abort_if($hocKy === null || $hocKy->trashed(), 404);
            $trangThaiCu = $hocKy->trang_thai;
            $trangThaiKeTiep = match ($trangThaiCu) {
                HocKy::UPCOMING => HocKy::ONGOING,
                HocKy::ONGOING => HocKy::CLOSED,
                default => null,
            };

            if ($trangThai !== $trangThaiKeTiep) {
                throw new LoiNghiepVu('SEMESTER_TRANSITION_INVALID', 'Chỉ được chuyển UPCOMING → ONGOING → CLOSED.');
            }

            if ($trangThai === HocKy::ONGOING && $cacKy->contains(
                fn (HocKy $ky) => ! $ky->trashed() && $ky->id !== $hocKy->id && $ky->trang_thai === HocKy::ONGOING,
            )) {
                throw new LoiNghiepVu('SEMESTER_TRANSITION_INVALID', 'Đã có một học kỳ đang diễn ra. Hãy đóng học kỳ đó trước.');
            }

            $hocKy->update(['trang_thai' => $trangThai]);
            NhatKy::ghi('hoc_ky', $hocKy->id, NhatKy::DOI_TRANG_THAI,
                ['trang_thai' => $trangThaiCu], ['trang_thai' => $trangThai],
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $hocKy->fresh();
        }, 3);
    }

    public function xoa(HocKy $hocKy, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($hocKy, $nguoiThucHienId) {
            $hocKy = $this->khoaDanhSach()->find($hocKy->id);
            abort_if($hocKy === null || $hocKy->trashed(), 404);

            if ($hocKy->trang_thai !== HocKy::UPCOMING) {
                throw new LoiNghiepVu('DELETE_BLOCKED', 'Chỉ được xóa học kỳ ở trạng thái UPCOMING.');
            }

            if ($hocKy->lopHocPhan()->exists()) {
                throw new LoiNghiepVu('SEMESTER_HAS_SECTIONS', 'Học kỳ vẫn còn lớp học phần, không thể xóa.');
            }

            $hocKy->deleted_by = $nguoiThucHienId;
            $hocKy->save();
            $hocKy->delete();
            NhatKy::ghi('hoc_ky', $hocKy->id, NhatKy::XOA, nguoiThucHienId: $nguoiThucHienId);
        }, 3);
    }

    /**
     * Khóa theo cùng thứ tự cho mọi thao tác ghi để tuần tự hóa kiểm tra
     * chồng lấn và một kỳ ONGOING trên MySQL; transaction được thử lại khi deadlock.
     *
     * @return Collection<int, HocKy>
     */
    private function khoaDanhSach(): Collection
    {
        return HocKy::withTrashed()->orderBy('id')->lockForUpdate()->get();
    }

    private function kiemTraDuLieu(array $duLieu, Collection $cacKy, ?int $boQuaId = null): void
    {
        $nam = explode('-', $duLieu['nam_hoc']);
        if ((int) $nam[1] !== (int) $nam[0] + 1) {
            throw ValidationException::withMessages(['nam_hoc' => ['Năm kết thúc phải liền sau năm bắt đầu.']]);
        }

        foreach (['mo_dang_ky_luc', 'dong_dang_ky_luc'] as $truong) {
            $ngay = substr($duLieu[$truong], 0, 10);
            if ($ngay < $duLieu['ngay_bat_dau'] || $ngay > $duLieu['ngay_ket_thuc']) {
                throw ValidationException::withMessages([$truong => ['Đợt đăng ký phải nằm trong khoảng ngày của học kỳ.']]);
            }
        }

        foreach ($cacKy as $ky) {
            if ($ky->id === $boQuaId) {
                continue;
            }

            // Giữ mã và tổ hợp năm học/kỳ thứ cho cả bản ghi đã xóa (BR-01).
            if ($ky->ma_hoc_ky === $duLieu['ma_hoc_ky']) {
                throw ValidationException::withMessages(['ma_hoc_ky' => ['Mã học kỳ đã tồn tại.']]);
            }
            if ($ky->nam_hoc === $duLieu['nam_hoc'] && $ky->ky_thu === (int) $duLieu['ky_thu']) {
                throw ValidationException::withMessages(['ky_thu' => ['Năm học này đã có kỳ thứ được chọn.']]);
            }

            if (! $ky->trashed()
                && $ky->ngay_bat_dau->format('Y-m-d') <= $duLieu['ngay_ket_thuc']
                && $ky->ngay_ket_thuc->format('Y-m-d') >= $duLieu['ngay_bat_dau']) {
                throw new LoiNghiepVu('SEMESTER_OVERLAP', 'Khoảng ngày chồng lấn với một học kỳ khác.');
            }
        }
    }
}
