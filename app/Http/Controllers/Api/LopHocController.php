<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLopHocRequest;
use App\Http\Requests\UpdateLopHocRequest;
use App\Http\Resources\LopHocResource;
use App\Models\LopHoc;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LopHocController extends Controller
{
    use ApiResponse;

    private const SORTABLE = ['id', 'ma_lop', 'ten_lop', 'giao_vien', 'si_so', 'trang_thai'];

    private const PER_PAGE_OPTIONS = [10, 25, 50];

    /**
     * Danh sách lớp học (hỗ trợ tìm kiếm, lọc, sắp xếp, phân trang).
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'trang_thai' => ['nullable', Rule::in(['0', '1'])],
            'si_so_min' => ['nullable', 'integer', 'min:1'],
            'si_so_max' => ['nullable', 'integer', 'min:1', 'gte:si_so_min'],
            'per_page' => ['nullable', 'integer', Rule::in(self::PER_PAGE_OPTIONS)],
            'sort_by' => ['nullable', Rule::in(self::SORTABLE)],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $search = trim($filters['search'] ?? '');

        $lopHocs = LopHoc::query()
            ->withCount('sinhViens')
            ->when($search !== '', function ($query) use ($search) {
                $keyword = "%{$search}%";
                $query->where(function ($q) use ($keyword) {
                    $q->where('ma_lop', 'like', $keyword)
                        ->orWhere('ten_lop', 'like', $keyword)
                        ->orWhere('giao_vien', 'like', $keyword);
                });
            })
            ->when(isset($filters['trang_thai']), fn ($q) => $q->where('trang_thai', (int) $filters['trang_thai']))
            ->when(isset($filters['si_so_min']), fn ($q) => $q->where('si_so', '>=', (int) $filters['si_so_min']))
            ->when(isset($filters['si_so_max']), fn ($q) => $q->where('si_so', '<=', (int) $filters['si_so_max']))
            ->orderBy($filters['sort_by'] ?? 'id', $filters['sort_dir'] ?? 'asc')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return $this->successPhanTrang(LopHocResource::collection($lopHocs));
    }

    /**
     * Thêm lớp học mới.
     */
    public function store(StoreLopHocRequest $request)
    {
        $lopHoc = LopHoc::create($request->validated());

        return $this->success(new LopHocResource($lopHoc), 'Thêm lớp học thành công!', 201);
    }

    /**
     * Chi tiết một lớp học, kèm danh sách sinh viên.
     */
    public function show(LopHoc $lopHoc)
    {
        $lopHoc->load('sinhViens')->loadCount('sinhViens');

        return $this->success(new LopHocResource($lopHoc));
    }

    /**
     * Cập nhật lớp học.
     */
    public function update(UpdateLopHocRequest $request, LopHoc $lopHoc)
    {
        $lopHoc->update($request->validated());

        return $this->success(new LopHocResource($lopHoc), 'Cập nhật lớp học thành công!');
    }

    /**
     * Xóa lớp học.
     */
    public function destroy(LopHoc $lopHoc)
    {
        $lopHoc->delete();

        return $this->success(null, 'Đã xóa lớp học thành công!');
    }
}
