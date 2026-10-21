<?php

namespace App\Http\Controllers;

use App\Models\SinhVien;
use App\Models\LopHoc;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreSinhVienRequest;
use App\Http\Requests\UpdateSinhVienRequest;

class SinhVienController extends Controller
{
    /**
     * Danh sách sinh viên — có phân trang
     */
    public function index(Request $request)
    {
        $ngaySinhDenRules = ['nullable', 'date'];
        if ($request->filled('ngay_sinh_tu')) {
            $ngaySinhDenRules[] = 'after_or_equal:ngay_sinh_tu';
        }

        $filters = $request->validate([
            'search'        => ['nullable', 'string', 'max:100'],
            'lop_hoc_id'    => ['nullable', 'integer', 'exists:lop_hocs,id'],
            'gioi_tinh'     => ['nullable', Rule::in(['0', '1'])],
            'trang_thai'    => ['nullable', Rule::in(['0', '1'])],
            'ngay_sinh_tu'  => ['nullable', 'date'],
            'ngay_sinh_den' => $ngaySinhDenRules,
            'per_page'      => ['nullable', 'integer', Rule::in([10, 25, 50])],
            'sort_by'       => ['nullable', Rule::in(['ma_sv', 'ho_ten', 'email', 'ngay_sinh', 'gioi_tinh', 'lop_hoc', 'so_dien_thoai', 'trang_thai'])],
            'sort_dir'      => ['nullable', Rule::in(['asc', 'desc'])],
        ], [
            'lop_hoc_id.exists' => 'Lớp học đã chọn không tồn tại.',
            'ngay_sinh_tu.date' => 'Ngày sinh từ không hợp lệ.',
            'ngay_sinh_den.date' => 'Ngày sinh đến không hợp lệ.',
            'ngay_sinh_den.after_or_equal' => 'Ngày sinh đến phải bằng hoặc sau ngày sinh từ.',
            'per_page.in' => 'Số dòng mỗi trang chỉ được chọn 10, 25 hoặc 50.',
        ]);

        $query = SinhVien::with('lopHoc');
        $search = trim($filters['search'] ?? '');

        if ($search !== '') {
            $query->where(function ($studentQuery) use ($search) {
                $studentQuery->where('ma_sv', 'like', "%{$search}%")
                    ->orWhere('ho_ten', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('so_dien_thoai', 'like', "%{$search}%");
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

        $perPage = (int) ($filters['per_page'] ?? 10);
        $sortBy = $filters['sort_by'] ?? 'ho_ten';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        if ($sortBy === 'lop_hoc') {
            $query->orderBy(
                LopHoc::query()
                    ->select('ten_lop')
                    ->whereColumn('lop_hocs.id', 'sinh_viens.lop_hoc_id'),
                $sortDir
            );
        } else {
            $query->orderBy('sinh_viens.' . $sortBy, $sortDir);
        }

        $sinhviens = $query->orderBy('sinh_viens.id')->paginate($perPage)->withQueryString();
        $lophocs = LopHoc::query()->orderBy('ten_lop')->get(['id', 'ten_lop', 'ma_lop']);

        return view('sinhvien.index', [
            'title'     => 'Danh sách sinh viên',
            'sinhviens' => $sinhviens,
            'lophocs'   => $lophocs,
        ]);
    }

    /**
     * Hiển thị form thêm sinh viên
     */
    public function create()
    {
        $lophocs = LopHoc::where('trang_thai', 1)->get();

        return view('sinhvien.create', [
            'title'   => 'Thêm sinh viên',
            'lophocs' => $lophocs,
        ]);
    }

    /**
     * Hiển thị thông tin chi tiết sinh viên.
     */
    public function show($id)
    {
        $sinhvien = SinhVien::with('lopHoc')->findOrFail($id);

        return view('sinhvien.show', [
            'title' => 'Chi tiết sinh viên',
            'sinhvien' => $sinhvien,
        ]);
    }

    /**
     * Xử lý lưu sinh viên mới
     */
    public function store(StoreSinhVienRequest $request)
    {
        try {
            SinhVien::create($request->validated());

            return redirect()->route('sinhvien.index')
                ->with('success', 'Thêm sinh viên thành công!');
        } catch (\Illuminate\Database\QueryException $e) {
            return redirect()->back()->withInput()
                ->withErrors(['error' => 'Lỗi khi thêm sinh viên: ' . $e->getMessage()]);
        } catch (\Exception $e) {
            return redirect()->back()->withInput()
                ->withErrors(['error' => 'Lỗi khi thêm sinh viên: ' . $e->getMessage()]);
        }
    }

    /**
     * Hiển thị form sửa sinh viên
     */
    public function edit($id)
    {
        $sinhvien = SinhVien::findOrFail($id);
        $lophocs  = LopHoc::where('trang_thai', 1)->get();

        return view('sinhvien.edit', [
            'title'    => 'Sửa sinh viên',
            'sinhvien' => $sinhvien,
            'lophocs'  => $lophocs,
        ]);
    }

    /**
     * Xử lý cập nhật sinh viên
     */
    public function update(UpdateSinhVienRequest $request, $id)
    {
        $sinhvien = SinhVien::findOrFail($id);

        $sinhvien->update($request->validated());

        return redirect()->route('sinhvien.index')
            ->with('success', 'Cập nhật sinh viên thành công!');
    }

    /**
     * Xóa sinh viên
     */
    public function destroy($id)
    {
        $sinhvien = SinhVien::findOrFail($id);
        $sinhvien->delete();

        return redirect()->route('sinhvien.index')
            ->with('success', 'Đã xóa sinh viên thành công!');
    }
}
