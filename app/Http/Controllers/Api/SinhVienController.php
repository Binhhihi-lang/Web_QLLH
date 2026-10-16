<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSinhVienRequest;
use App\Http\Requests\UpdateSinhVienRequest;
use App\Http\Resources\SinhVienResource;
use App\Models\LopHoc;
use App\Models\SinhVien;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SinhVienController extends Controller
{
    use ApiResponse;

    private const SORTABLE = [
        'ma_sv', 'ho_ten', 'email', 'ngay_sinh',
        'gioi_tinh', 'lop_hoc', 'so_dien_thoai', 'trang_thai',
    ];

    private const PER_PAGE_OPTIONS = [10, 25, 50];

    /**
     * Danh sách sinh viên (hỗ trợ tìm kiếm, lọc, sắp xếp, phân trang).
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'lop_hoc_id' => ['nullable', 'integer', 'exists:lop_hocs,id'],
            'gioi_tinh' => ['nullable', Rule::in(['0', '1'])],
            'trang_thai' => ['nullable', Rule::in(['0', '1'])],
            'ngay_sinh_tu' => ['nullable', 'date'],
            'ngay_sinh_den' => ['nullable', 'date', 'after_or_equal:ngay_sinh_tu'],
            'per_page' => ['nullable', 'integer', Rule::in(self::PER_PAGE_OPTIONS)],
            'sort_by' => ['nullable', Rule::in(self::SORTABLE)],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $search = trim($filters['search'] ?? '');
        $sortBy = $filters['sort_by'] ?? 'ho_ten';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $query = SinhVien::query()->with('lopHoc');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $keyword = "%{$search}%";
                $q->where('ma_sv', 'like', $keyword)
                    ->orWhere('ho_ten', 'like', $keyword)
                    ->orWhere('email', 'like', $keyword)
                    ->orWhere('so_dien_thoai', 'like', $keyword);
            });
        }

        foreach (['lop_hoc_id', 'gioi_tinh', 'trang_thai'] as $filterName) {
            if (isset($filters[$filterName])) {
                $query->where($filterName, $filters[$filterName]);
            }
        }

        if (isset($filters['ngay_sinh_tu'])) {
            $query->whereDate('ngay_sinh', '>=', $filters['ngay_sinh_tu']);
        }

        if (isset($filters['ngay_sinh_den'])) {
            $query->whereDate('ngay_sinh', '<=', $filters['ngay_sinh_den']);
        }

        // Sắp xếp theo tên lớp cần subquery vì nằm ở bảng khác.
        if ($sortBy === 'lop_hoc') {
            $query->orderBy(
                LopHoc::query()->select('ten_lop')
                    ->whereColumn('lop_hocs.id', 'sinh_viens.lop_hoc_id'),
                $sortDir
            );
        } else {
            $query->orderBy('sinh_viens.' . $sortBy, $sortDir);
        }

        $sinhViens = $query->orderBy('sinh_viens.id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return $this->successPhanTrang(SinhVienResource::collection($sinhViens));
    }

    /**
     * Thêm sinh viên mới.
     */
    public function store(StoreSinhVienRequest $request)
    {
        $sinhVien = SinhVien::create($request->validated());

        return $this->success(new SinhVienResource($sinhVien), 'Thêm sinh viên thành công!', 201);
    }

    /**
     * Chi tiết một sinh viên, kèm thông tin lớp học.
     */
    public function show(SinhVien $sinhVien)
    {
        $sinhVien->load('lopHoc');

        return $this->success(new SinhVienResource($sinhVien));
    }

    /**
     * Cập nhật sinh viên.
     */
    public function update(UpdateSinhVienRequest $request, SinhVien $sinhVien)
    {
        $sinhVien->update($request->validated());

        return $this->success(new SinhVienResource($sinhVien), 'Cập nhật sinh viên thành công!');
    }

    /**
     * Xóa sinh viên.
     */
    public function destroy(SinhVien $sinhVien)
    {
        $sinhVien->delete();

        return $this->success(null, 'Đã xóa sinh viên thành công!');
    }
}
