<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\BuoiHoc;
use App\Models\NhatKy;
use App\Models\PhongHoc;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class QuanLyPhongHocService
{
    public function xoa(PhongHoc $phongHoc, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($phongHoc, $nguoiThucHienId) {
            $phongHoc = PhongHoc::query()->lockForUpdate()->findOrFail($phongHoc->id);
            $bayGio = now();
            $biChan = BuoiHoc::query()
                ->where('phong_hoc_id', $phongHoc->id)
                ->where('trang_thai', BuoiHoc::SCHEDULED)
                ->where(function ($query) use ($bayGio) {
                    $query->whereDate('ngay_hoc', '>', $bayGio->toDateString())
                        ->orWhere(fn ($query) => $query
                            ->whereDate('ngay_hoc', $bayGio->toDateString())
                            ->whereTime('gio_ket_thuc', '>', $bayGio->format('H:i:s')));
                })
                ->exists();

            if ($biChan) {
                throw new LoiNghiepVu('DELETE_BLOCKED', 'Phòng học còn buổi học đã xếp lịch chưa kết thúc.');
            }

            $phongHoc->deleted_by = $nguoiThucHienId;
            $phongHoc->save();
            $phongHoc->delete();
            NhatKy::ghi('phong_hoc', $phongHoc->id, NhatKy::XOA, nguoiThucHienId: $nguoiThucHienId);
        });
    }

    public function doiTrangThaiHangLoat(array $ids, bool $trangThai): array
    {
        return DB::transaction(function () use ($ids, $trangThai) {
            $phongHocs = PhongHoc::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get(['id'])
                ->keyBy('id');
            $tonTai = $phongHocs->keys()->all();

            if ($tonTai !== []) {
                PhongHoc::query()->whereIn('id', $tonTai)->update([
                    'trang_thai' => $trangThai,
                    'updated_at' => now(),
                ]);
            }

            return array_map(fn (int $id) => $phongHocs->has($id)
                ? ['id' => $id, 'ket_qua' => 'THANH_CONG']
                : ['id' => $id, 'ket_qua' => 'THAT_BAI', 'ma_loi' => 'NOT_FOUND'], $ids);
        });
    }

    public function xoaHangLoat(array $ids, int $nguoiThucHienId): array
    {
        $ketQua = [];

        foreach ($ids as $id) {
            try {
                $this->xoa(PhongHoc::query()->findOrFail($id), $nguoiThucHienId);
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
