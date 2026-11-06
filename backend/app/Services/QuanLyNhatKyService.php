<?php

namespace App\Services;

use App\Models\NhatKy;
use Illuminate\Pagination\LengthAwarePaginator;

class QuanLyNhatKyService
{
    /**
     * Lấy danh sách nhật ký hệ thống kèm phân trang và bộ lọc.
     *
     * @param  array<string, mixed>  $filters
     */
    public function danhSach(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = NhatKy::query()
            ->with(['nguoiThucHien' => fn ($q) => $q->withTrashed()]);

        if (! empty($filters['doi_tuong_loai'])) {
            $query->where('doi_tuong_loai', $filters['doi_tuong_loai']);
        }

        if (! empty($filters['hanh_dong'])) {
            $query->where('hanh_dong', $filters['hanh_dong']);
        }

        if (! empty($filters['nguoi_thuc_hien_id'])) {
            $query->where('nguoi_thuc_hien_id', (int) $filters['nguoi_thuc_hien_id']);
        }

        if (! empty($filters['tu_ngay'])) {
            $query->whereDate('thoi_diem', '>=', $filters['tu_ngay']);
        }

        if (! empty($filters['den_ngay'])) {
            $query->whereDate('thoi_diem', '<=', $filters['den_ngay']);
        }

        if (! empty($filters['q'])) {
            $keyword = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($keyword, $filters) {
                $q->where('ghi_chu', 'like', $keyword)
                    ->orWhereHas('nguoiThucHien', fn ($userQ) => $userQ->where('name', 'like', $keyword)->orWhere('email', 'like', $keyword));

                if (is_numeric($filters['q'])) {
                    $q->orWhere('doi_tuong_id', (int) $filters['q']);
                }
            });
        }

        $sortBy = $filters['sort_by'] ?? 'thoi_diem';
        $sortDir = strtolower($filters['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);
        if ($sortBy !== 'id') {
            $query->orderBy('id', 'desc');
        }

        return $query->paginate($perPage);
    }

    /**
     * Lấy chi tiết một bản ghi nhật ký.
     */
    public function chiTiet(NhatKy $nhatKy): NhatKy
    {
        return $nhatKy->loadMissing(['nguoiThucHien' => fn ($q) => $q->withTrashed()]);
    }

    /**
     * Danh sách options phục vụ bộ lọc tìm kiếm trên giao diện.
     *
     * @return array<string, array<int, array{value: string, label: string}>>
     */
    public function danhSachOptions(): array
    {
        $doiTuongLoai = [];
        foreach (NhatKy::DOI_TUONG as $value => $label) {
            $doiTuongLoai[] = [
                'value' => $value,
                'label' => $label,
            ];
        }

        $hanhDong = [];
        foreach (NhatKy::HANH_DONG as $value => $label) {
            $hanhDong[] = [
                'value' => $value,
                'label' => $label,
            ];
        }

        return [
            'doi_tuong_loai' => $doiTuongLoai,
            'hanh_dong' => $hanhDong,
        ];
    }
}
