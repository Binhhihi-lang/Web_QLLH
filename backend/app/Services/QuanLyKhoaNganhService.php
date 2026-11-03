<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\Khoa;
use App\Models\Nganh;
use App\Models\NhatKy;
use Illuminate\Support\Facades\DB;

/**
 * Nghiệp vụ danh mục Khoa / Ngành (ADR-020).
 *
 * Quy tắc xóa: khoa còn ngành, ngành còn giảng viên hoặc lớp hành chính thì chặn —
 * xóa mềm ở đây mà không chặn sẽ để lại khóa ngoại trỏ vào bản ghi đã xóa.
 */
class QuanLyKhoaNganhService
{
    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function taoKhoa(array $duLieu, int $nguoiThucHienId): Khoa
    {
        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            $khoa = Khoa::query()->create($duLieu);

            NhatKy::ghi(
                'khoa',
                $khoa->id,
                NhatKy::TAO,
                null,
                $this->duLieuKhoa($khoa),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $khoa;
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function capNhatKhoa(Khoa $khoa, array $duLieu, int $nguoiThucHienId): Khoa
    {
        return DB::transaction(function () use ($khoa, $duLieu, $nguoiThucHienId) {
            $khoa = Khoa::query()->lockForUpdate()->findOrFail($khoa->id);
            $truoc = $this->duLieuKhoa($khoa);

            $khoa->update($duLieu);

            NhatKy::ghi(
                'khoa',
                $khoa->id,
                NhatKy::CAP_NHAT,
                $truoc,
                $this->duLieuKhoa($khoa->fresh()),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $khoa->fresh();
        });
    }

    public function xoaKhoa(Khoa $khoa, int $nguoiThucHienId): void
    {
        if ($khoa->nganh()->exists()) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Khoa vẫn còn ngành, không xóa được.');
        }

        if ($khoa->monHoc()->exists()) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Khoa vẫn còn môn học, không xóa được.');
        }

        DB::transaction(function () use ($khoa, $nguoiThucHienId) {
            $khoa = Khoa::query()->lockForUpdate()->findOrFail($khoa->id);

            NhatKy::ghi(
                'khoa',
                $khoa->id,
                NhatKy::XOA,
                $this->duLieuKhoa($khoa),
                null,
                nguoiThucHienId: $nguoiThucHienId,
            );

            $khoa->deleted_by = $nguoiThucHienId;
            $khoa->save();
            $khoa->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function taoNganh(array $duLieu, int $nguoiThucHienId): Nganh
    {
        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            $nganh = Nganh::query()->create($duLieu);

            NhatKy::ghi(
                'nganh',
                $nganh->id,
                NhatKy::TAO,
                null,
                $this->duLieuNganh($nganh),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $nganh->load('khoa');
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function capNhatNganh(Nganh $nganh, array $duLieu, int $nguoiThucHienId): Nganh
    {
        return DB::transaction(function () use ($nganh, $duLieu, $nguoiThucHienId) {
            $nganh = Nganh::query()->lockForUpdate()->findOrFail($nganh->id);
            $truoc = $this->duLieuNganh($nganh);

            $nganh->update($duLieu);

            NhatKy::ghi(
                'nganh',
                $nganh->id,
                NhatKy::CAP_NHAT,
                $truoc,
                $this->duLieuNganh($nganh->fresh()),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $nganh->fresh()->load('khoa');
        });
    }

    public function xoaNganh(Nganh $nganh, int $nguoiThucHienId): void
    {
        if ($nganh->giangVien()->exists()) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Ngành vẫn còn giảng viên, không xóa được.');
        }

        if ($nganh->lopHanhChinh()->exists()) {
            throw new LoiNghiepVu('DELETE_BLOCKED', 'Ngành vẫn còn lớp hành chính, không xóa được.');
        }

        DB::transaction(function () use ($nganh, $nguoiThucHienId) {
            $nganh = Nganh::query()->lockForUpdate()->findOrFail($nganh->id);

            NhatKy::ghi(
                'nganh',
                $nganh->id,
                NhatKy::XOA,
                $this->duLieuNganh($nganh),
                null,
                nguoiThucHienId: $nguoiThucHienId,
            );

            $nganh->deleted_by = $nguoiThucHienId;
            $nganh->save();
            $nganh->delete();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function duLieuKhoa(Khoa $khoa): array
    {
        return $khoa->only(['ma_khoa', 'ten_khoa', 'trang_thai']);
    }

    /**
     * @return array<string, mixed>
     */
    private function duLieuNganh(Nganh $nganh): array
    {
        return $nganh->only(['khoa_id', 'ma_nganh', 'ten_nganh', 'trang_thai']);
    }
}
