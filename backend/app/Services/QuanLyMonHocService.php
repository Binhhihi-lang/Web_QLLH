<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\HocKy;
use App\Models\LopHocPhan;
use App\Models\MonHoc;
use App\Models\NhatKy;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class QuanLyMonHocService
{
    public function xoa(MonHoc $monHoc, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($monHoc, $nguoiThucHienId) {
            $monHoc = MonHoc::query()->lockForUpdate()->findOrFail($monHoc->id);
            $biChan = LopHocPhan::query()
                ->where('mon_hoc_id', $monHoc->id)
                ->whereHas('hocKy', fn ($query) => $query->where('trang_thai', '!=', HocKy::CLOSED))
                ->exists();

            if ($biChan) {
                throw new LoiNghiepVu('DELETE_BLOCKED', 'Môn học còn lớp học phần thuộc học kỳ chưa đóng.');
            }

            $monHoc->deleted_by = $nguoiThucHienId;
            $monHoc->save();
            $monHoc->delete();
            NhatKy::ghi('mon_hoc', $monHoc->id, NhatKy::XOA, nguoiThucHienId: $nguoiThucHienId);
        });
    }

    public function doiTrangThaiHangLoat(array $ids, bool $trangThai): array
    {
        return DB::transaction(function () use ($ids, $trangThai) {
            $monHocs = MonHoc::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get(['id'])
                ->keyBy('id');
            $tonTai = $monHocs->keys()->all();

            if ($tonTai !== []) {
                MonHoc::query()->whereIn('id', $tonTai)->update([
                    'trang_thai' => $trangThai,
                    'updated_at' => now(),
                ]);
            }

            return array_map(fn (int $id) => $monHocs->has($id)
                ? ['id' => $id, 'ket_qua' => 'THANH_CONG']
                : ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND'], $ids);
        });
    }

    public function xoaHangLoat(array $ids, int $nguoiThucHienId): array
    {
        $ketQua = [];

        foreach ($ids as $id) {
            try {
                $this->xoa(MonHoc::query()->findOrFail($id), $nguoiThucHienId);
                $ketQua[] = ['id' => $id, 'ket_qua' => 'THANH_CONG'];
            } catch (LoiNghiepVu $exception) {
                $ketQua[] = [
                    'id' => $id,
                    'ket_qua' => 'THAT_BAI',
                    'ma_loi' => $exception->maLoi,
                    'message' => $exception->getMessage(),
                ];
            } catch (ModelNotFoundException) {
                $ketQua[] = ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND'];
            }
        }

        return $ketQua;
    }
}
