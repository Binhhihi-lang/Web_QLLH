<?php

namespace App\Services;

use App\Exceptions\LoiNghiepVu;
use App\Models\ChuongTrinhDaoTao;
use App\Models\ChuongTrinhMon;
use App\Models\LopHanhChinh;
use App\Models\MonHoc;
use App\Models\NhatKy;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Nghiệp vụ chương trình đào tạo (ADR-016 bổ sung 2026-11-13).
 *
 * Một chương trình = một ngành × một khóa. Bảng `chuong_trinh_mon` là bảng nối
 * nên không có softDeletes: gỡ môn là xóa thật, còn lịch sử thay đổi nằm ở
 * `nhat_ky` (đối tượng `chuong_trinh_dao_tao`, kèm `mon_hoc_id` trong giá trị).
 *
 * Vì sao kiểm tra trùng ở đây chứ không ở Form Request: unique của bảng phủ cả
 * bản ghi đã xóa mềm, và hợp đồng của module trả `DUPLICATE_CODE` (409) thay vì
 * lỗi validate từng trường để FE hiển thị một thông báo nghiệp vụ duy nhất.
 */
class QuanLyChuongTrinhService
{
    /**
     * Danh sách có phân trang, kèm số môn / tổng tín chỉ / số sinh viên áp dụng.
     *
     * @param  array<string, mixed>  $loc
     */
    public function danhSach(array $loc): LengthAwarePaginator
    {
        $perPage = (int) ($loc['per_page'] ?? 10);
        $trang = max(1, (int) ($loc['page'] ?? 1));
        $truyVan = $this->truyVanDanhSach($loc);

        $tuKhoa = trim((string) ($loc['q'] ?? ''));

        if ($tuKhoa === '') {
            return $truyVan->paginate($perPage)->withQueryString();
        }

        // Tìm không dấu: MySQL lẫn SQLite (test) không có cùng hàm bỏ dấu, còn
        // danh mục này nhỏ (một dòng / ngành × khóa) nên lọc trong PHP — cùng
        // cách `/options` đang làm để kết quả giống nhau ở hai hệ quản trị.
        $kim = Str::ascii(mb_strtolower($tuKhoa));
        $khop = $truyVan->get()
            ->filter(fn (ChuongTrinhDaoTao $ct) => str_contains(
                Str::ascii(mb_strtolower($ct->ma_ctdt.' '.$ct->ten)),
                $kim,
            ))
            ->values();

        return (new LengthAwarePaginator(
            $khop->forPage($trang, $perPage),
            $khop->count(),
            $perPage,
            $trang,
            ['path' => Paginator::resolveCurrentPath()],
        ))->withQueryString();
    }

    /**
     * Chi tiết chương trình kèm tổng hợp; các con số được gắn thành thuộc tính
     * để Resource đọc chung một kiểu ở cả danh sách và chi tiết.
     */
    public function chiTiet(ChuongTrinhDaoTao $chuongTrinh): ChuongTrinhDaoTao
    {
        $chuongTrinh->load(['nganh.khoa', 'mon.monHoc']);
        $mons = $chuongTrinh->mon;

        $chuongTrinh->setAttribute('mon_count', $mons->count());
        $chuongTrinh->setAttribute('tong_tin_chi', (int) $mons->sum(
            fn (ChuongTrinhMon $mon) => $mon->monHoc?->so_tin_chi ?? 0,
        ));
        $chuongTrinh->setAttribute('so_sinh_vien', $this->demSinhVien($chuongTrinh));
        $chuongTrinh->setAttribute('so_bat_buoc', $mons->where('bat_buoc', true)->count());
        $chuongTrinh->setAttribute('so_tu_chon', $mons->where('bat_buoc', false)->count());
        $chuongTrinh->setAttribute('so_mon_chua_gan_ky', $mons->whereNull('ky_thu')->count());
        $chuongTrinh->setAttribute('ma_lop_hanh_chinh_goi_y', LopHanhChinh::query()
            ->where('nganh_id', $chuongTrinh->nganh_id)
            ->where('khoa_hoc', $chuongTrinh->khoa_hoc)
            ->orderBy('ma_lop')
            ->value('ma_lop'));

        return $chuongTrinh;
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function tao(array $duLieu, int $nguoiThucHienId): ChuongTrinhDaoTao
    {
        return DB::transaction(function () use ($duLieu, $nguoiThucHienId) {
            $this->kiemTraTrung($duLieu);

            try {
                $chuongTrinh = ChuongTrinhDaoTao::query()->create($duLieu);
            } catch (QueryException $exception) {
                throw $this->loiTrung($exception);
            }

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinh->id,
                NhatKy::TAO,
                null,
                $this->duLieu($chuongTrinh),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $chuongTrinh->load('nganh.khoa');
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function sua(ChuongTrinhDaoTao $chuongTrinh, array $duLieu, int $nguoiThucHienId): ChuongTrinhDaoTao
    {
        return DB::transaction(function () use ($chuongTrinh, $duLieu, $nguoiThucHienId) {
            $chuongTrinh = ChuongTrinhDaoTao::query()->lockForUpdate()->findOrFail($chuongTrinh->id);
            $truoc = $this->duLieu($chuongTrinh);

            $this->kiemTraTrung($duLieu, $chuongTrinh->id);

            try {
                $chuongTrinh->update($duLieu);
            } catch (QueryException $exception) {
                throw $this->loiTrung($exception);
            }

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinh->id,
                NhatKy::CAP_NHAT,
                $truoc,
                $this->duLieu($chuongTrinh->fresh()),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $chuongTrinh->fresh()->load('nganh.khoa');
        });
    }

    public function xoa(ChuongTrinhDaoTao $chuongTrinh, User $nguoiThucHien): void
    {
        DB::transaction(function () use ($chuongTrinh, $nguoiThucHien) {
            $chuongTrinh = ChuongTrinhDaoTao::query()->lockForUpdate()->findOrFail($chuongTrinh->id);

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinh->id,
                NhatKy::XOA,
                $this->duLieu($chuongTrinh),
                null,
                nguoiThucHienId: $nguoiThucHien->id,
            );

            $chuongTrinh->deleted_by = $nguoiThucHien->id;
            $chuongTrinh->save();
            $chuongTrinh->delete();
        });
    }

    /**
     * Thêm nhiều môn một lượt. Môn đã có trong chương trình thì bỏ qua, không lỗi —
     * ADMIN hay dán cả danh sách môn nên chặn ở đây chỉ làm hỏng thao tác.
     *
     * @param  array<int, int>  $monIds
     * @return array{thanh_cong: int, bo_qua: int}
     */
    public function themMon(ChuongTrinhDaoTao $chuongTrinh, array $monIds, ?int $kyThu, bool $batBuoc, int $nguoiThucHienId): array
    {
        return DB::transaction(function () use ($chuongTrinh, $monIds, $kyThu, $batBuoc, $nguoiThucHienId) {
            $chuongTrinh = ChuongTrinhDaoTao::query()->lockForUpdate()->findOrFail($chuongTrinh->id);
            $monIds = array_values(array_unique($monIds));

            $daCo = ChuongTrinhMon::query()
                ->where('chuong_trinh_id', $chuongTrinh->id)
                ->whereIn('mon_hoc_id', $monIds)
                ->pluck('mon_hoc_id')
                ->all();
            $moi = array_values(array_diff($monIds, $daCo));

            $bayGio = now();
            $dong = array_map(fn (int $monId) => [
                'chuong_trinh_id' => $chuongTrinh->id,
                'mon_hoc_id' => $monId,
                'ky_thu' => $kyThu,
                'bat_buoc' => $batBuoc,
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ], $moi);

            if ($dong !== []) {
                ChuongTrinhMon::query()->insert($dong);
            }

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinh->id,
                NhatKy::CAP_NHAT,
                null,
                [
                    'them_mon' => $moi,
                    'ky_thu' => $kyThu,
                    'bat_buoc' => $batBuoc,
                    'bo_qua' => $daCo,
                ],
                nguoiThucHienId: $nguoiThucHienId,
            );

            return ['thanh_cong' => count($moi), 'bo_qua' => count($daCo)];
        });
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    public function suaMon(ChuongTrinhMon $chuongTrinhMon, array $duLieu, int $nguoiThucHienId): ChuongTrinhMon
    {
        return DB::transaction(function () use ($chuongTrinhMon, $duLieu, $nguoiThucHienId) {
            $chuongTrinhMon = ChuongTrinhMon::query()->lockForUpdate()->findOrFail($chuongTrinhMon->id);
            $truoc = ['mon_hoc_id' => $chuongTrinhMon->mon_hoc_id] + $chuongTrinhMon->only(['ky_thu', 'bat_buoc']);

            $chuongTrinhMon->update(array_intersect_key($duLieu, array_flip(['ky_thu', 'bat_buoc'])));
            $chuongTrinhMon = $chuongTrinhMon->fresh();

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinhMon->chuong_trinh_id,
                NhatKy::CAP_NHAT,
                $truoc,
                ['mon_hoc_id' => $chuongTrinhMon->mon_hoc_id] + $chuongTrinhMon->only(['ky_thu', 'bat_buoc']),
                nguoiThucHienId: $nguoiThucHienId,
            );

            return $chuongTrinhMon->load('monHoc');
        });
    }

    /**
     * `chuong_trinh_mon` không có softDeletes — gỡ môn là xóa cứng, dấu vết nằm ở nhật ký.
     */
    public function xoaMon(ChuongTrinhMon $chuongTrinhMon, int $nguoiThucHienId): void
    {
        DB::transaction(function () use ($chuongTrinhMon, $nguoiThucHienId) {
            $chuongTrinhMon = ChuongTrinhMon::query()->lockForUpdate()->findOrFail($chuongTrinhMon->id);

            NhatKy::ghi(
                'chuong_trinh_dao_tao',
                $chuongTrinhMon->chuong_trinh_id,
                NhatKy::XOA,
                ['mon_hoc_id' => $chuongTrinhMon->mon_hoc_id] + $chuongTrinhMon->only(['ky_thu', 'bat_buoc']),
                null,
                nguoiThucHienId: $nguoiThucHienId,
            );

            $chuongTrinhMon->delete();
        });
    }

    /**
     * Import nhiều dòng môn (BR-31): mỗi dòng xử lý độc lập, dòng sai không
     * làm rollback các dòng đúng — ADMIN dán từ Excel nên thường chỉ vài dòng
     * lệch mã môn.
     *
     * @param  array<int, array<string, mixed>>  $dong
     * @return array{thanh_cong: int, that_bai: int, chi_tiet: array<int, array<string, mixed>>}
     */
    public function importCsv(ChuongTrinhDaoTao $chuongTrinh, array $dong, int $nguoiThucHienId): array
    {
        $monTheoMa = MonHoc::query()
            ->whereIn('ma_mon', collect($dong)->pluck('ma_mon')->map(fn ($ma) => trim((string) $ma))->all())
            ->get()
            ->keyBy('ma_mon');

        $daCo = ChuongTrinhMon::query()
            ->where('chuong_trinh_id', $chuongTrinh->id)
            ->pluck('mon_hoc_id')
            ->all();

        $chiTiet = [];
        $thanhCong = 0;
        $thatBai = 0;
        $bayGio = now();

        foreach ($dong as $viTri => $row) {
            $soDong = $viTri + 1;
            $maMon = trim((string) ($row['ma_mon'] ?? ''));
            /** @var MonHoc|null $monHoc */
            $monHoc = $monTheoMa->get($maMon);

            if ($monHoc === null) {
                $thatBai++;
                $chiTiet[] = [
                    'dong' => $soDong,
                    'ma_mon' => $maMon,
                    'ket_qua' => 'THAT_BAI',
                    'ma_loi' => 'MON_NOT_FOUND',
                    'message' => "Môn '{$maMon}' không tồn tại.",
                ];

                continue;
            }

            if (in_array($monHoc->id, $daCo, true)) {
                $chiTiet[] = [
                    'dong' => $soDong,
                    'ma_mon' => $maMon,
                    'ket_qua' => 'BO_QUA',
                    'message' => 'Môn đã có trong chương trình.',
                ];

                continue;
            }

            ChuongTrinhMon::query()->insert([
                'chuong_trinh_id' => $chuongTrinh->id,
                'mon_hoc_id' => $monHoc->id,
                'ky_thu' => $row['ky_thu'] ?? null,
                'bat_buoc' => (bool) ($row['bat_buoc'] ?? true),
                'created_at' => $bayGio,
                'updated_at' => $bayGio,
            ]);

            $daCo[] = $monHoc->id;
            $thanhCong++;
            $chiTiet[] = [
                'dong' => $soDong,
                'ma_mon' => $maMon,
                'ket_qua' => 'THANH_CONG',
            ];
        }

        NhatKy::ghi(
            'chuong_trinh_dao_tao',
            $chuongTrinh->id,
            NhatKy::CAP_NHAT,
            null,
            ['import' => ['thanh_cong' => $thanhCong, 'that_bai' => $thatBai]],
            nguoiThucHienId: $nguoiThucHienId,
        );

        return ['thanh_cong' => $thanhCong, 'that_bai' => $thatBai, 'chi_tiet' => $chiTiet];
    }

    /**
     * Chương trình của chính sinh viên, môn nhóm theo kỳ để màn đăng ký biết
     * học kỳ hiện tại nên đề xuất môn nào.
     *
     * @return array<string, mixed>
     */
    public function chuongTrinhCuaSinhVien(SinhVien $sinhVien): array
    {
        $sinhVien->loadMissing('lopHanhChinh');
        $lop = $sinhVien->lopHanhChinh;

        if ($lop === null) {
            throw new LoiNghiepVu('NOT_FOUND', 'Sinh viên chưa thuộc lớp hành chính.', 404);
        }

        $chuongTrinh = ChuongTrinhDaoTao::query()
            ->with(['nganh.khoa', 'mon.monHoc'])
            ->where('nganh_id', $lop->nganh_id)
            ->where('khoa_hoc', $lop->khoa_hoc)
            ->orderByDesc('trang_thai')
            ->orderBy('id')
            ->first();

        if ($chuongTrinh === null) {
            throw new LoiNghiepVu('NOT_FOUND', 'Chưa có chương trình đào tạo cho ngành và khóa của bạn.', 404);
        }

        // Sắp theo kỳ thứ, môn chưa gán kỳ đẩy xuống cuối.
        $mons = $chuongTrinh->mon
            ->sortBy(fn (ChuongTrinhMon $mon) => sprintf('%02d-%06d', $mon->ky_thu ?? 99, $mon->mon_hoc_id))
            ->values();

        $nhomKy = $mons
            ->groupBy(fn (ChuongTrinhMon $mon) => $mon->ky_thu ?? 0)
            ->map(fn ($nhom, $kyThu) => [
                'ky_thu' => $kyThu === 0 ? null : (int) $kyThu,
                'so_mon' => $nhom->count(),
                'tong_tin_chi' => (int) $nhom->sum(fn (ChuongTrinhMon $mon) => $mon->monHoc?->so_tin_chi ?? 0),
                'mon' => $nhom->values(),
            ])
            ->values();

        // Khối chương trình chỉ cần tổng hợp; danh sách môn đã nằm trong `ky`,
        // bỏ quan hệ đi để payload không chứa hai bản của cùng danh sách.
        $chuongTrinh->setAttribute('mon_count', $mons->count());
        $chuongTrinh->setAttribute('tong_tin_chi', (int) $mons->sum(
            fn (ChuongTrinhMon $mon) => $mon->monHoc?->so_tin_chi ?? 0,
        ));
        $chuongTrinh->setAttribute('so_sinh_vien', $this->demSinhVien($chuongTrinh));
        $chuongTrinh->unsetRelation('mon');

        return [
            'chuong_trinh' => $chuongTrinh,
            'ky' => $nhomKy,
        ];
    }

    /**
     * @param  array<string, mixed>  $loc
     */
    private function truyVanDanhSach(array $loc): Builder
    {
        $tongTinChi = DB::table('chuong_trinh_mon')
            ->join('mon_hoc', 'mon_hoc.id', '=', 'chuong_trinh_mon.mon_hoc_id')
            ->whereColumn('chuong_trinh_mon.chuong_trinh_id', 'chuong_trinh_dao_tao.id')
            ->whereNull('mon_hoc.deleted_at')
            ->selectRaw('coalesce(sum(mon_hoc.so_tin_chi), 0)');

        $soSinhVien = DB::table('sinh_vien')
            ->join('lop_hanh_chinh', 'lop_hanh_chinh.id', '=', 'sinh_vien.lop_hanh_chinh_id')
            ->whereColumn('lop_hanh_chinh.nganh_id', 'chuong_trinh_dao_tao.nganh_id')
            ->whereColumn('lop_hanh_chinh.khoa_hoc', 'chuong_trinh_dao_tao.khoa_hoc')
            ->whereNull('sinh_vien.deleted_at')
            ->whereNull('lop_hanh_chinh.deleted_at')
            ->selectRaw('count(*)');

        $sortBy = in_array($loc['sort_by'] ?? null, ['id', 'ma_ctdt', 'ten', 'khoa_hoc', 'trang_thai'], true)
            ? $loc['sort_by']
            : 'id';
        $sortDir = ($loc['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        // `withCount('mon')` sinh alias `mon_count`, không phải `so_mon`; resource đọc
        // cả hai tên. Phải gọi selectSub SAU withCount và KHÔNG select('*') sau đó —
        // `select('*')` sẽ ghi đè danh sách cột và làm mất alias của withCount.
        $query = ChuongTrinhDaoTao::query()
            ->with('nganh.khoa')
            ->withCount('mon')
            ->selectSub($tongTinChi, 'tong_tin_chi')
            ->selectSub($soSinhVien, 'so_sinh_vien');

        return $query
            ->when(! empty($loc['nganh_id']), fn ($query) => $query->where('nganh_id', (int) $loc['nganh_id']))
            ->when(! empty($loc['khoa_hoc']), fn ($query) => $query->where('khoa_hoc', $loc['khoa_hoc']))
            ->when(isset($loc['trang_thai']), fn ($query) => $query->where('trang_thai', (bool) $loc['trang_thai']))
            ->orderBy($sortBy, $sortDir);
    }

    /**
     * @param  array<string, mixed>  $duLieu
     */
    private function kiemTraTrung(array $duLieu, ?int $boQuaId = null): void
    {
        $trungMa = ChuongTrinhDaoTao::withTrashed()
            ->where('ma_ctdt', $duLieu['ma_ctdt'])
            ->when($boQuaId !== null, fn ($query) => $query->whereKeyNot($boQuaId))
            ->exists();

        if ($trungMa) {
            throw new LoiNghiepVu('DUPLICATE_CODE', 'Mã chương trình đào tạo đã tồn tại.', 409);
        }

        $trungCap = ChuongTrinhDaoTao::withTrashed()
            ->where('nganh_id', $duLieu['nganh_id'])
            ->where('khoa_hoc', $duLieu['khoa_hoc'])
            ->when($boQuaId !== null, fn ($query) => $query->whereKeyNot($boQuaId))
            ->exists();

        if ($trungCap) {
            throw new LoiNghiepVu('DUPLICATE_CODE', 'Ngành và khóa học này đã có chương trình đào tạo.', 409);
        }
    }

    /**
     * Hai request đồng thời vượt qua `kiemTraTrung` thì unique index của bảng mới
     * là hàng rào cuối — đổi lỗi SQL thành cùng mã nghiệp vụ để FE không phải
     * bắt thêm một kiểu lỗi nữa.
     */
    private function loiTrung(QueryException $exception): \Throwable
    {
        return $exception->getCode() === '23000'
            ? new LoiNghiepVu('DUPLICATE_CODE', 'Chương trình đào tạo đã tồn tại.', 409)
            : $exception;
    }

    private function demSinhVien(ChuongTrinhDaoTao $chuongTrinh): int
    {
        return (int) DB::table('sinh_vien')
            ->join('lop_hanh_chinh', 'lop_hanh_chinh.id', '=', 'sinh_vien.lop_hanh_chinh_id')
            ->where('lop_hanh_chinh.nganh_id', $chuongTrinh->nganh_id)
            ->where('lop_hanh_chinh.khoa_hoc', $chuongTrinh->khoa_hoc)
            ->whereNull('sinh_vien.deleted_at')
            ->whereNull('lop_hanh_chinh.deleted_at')
            ->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function duLieu(ChuongTrinhDaoTao $chuongTrinh): array
    {
        return $chuongTrinh->only(['ma_ctdt', 'nganh_id', 'khoa_hoc', 'ten', 'mo_ta', 'trang_thai']);
    }
}
