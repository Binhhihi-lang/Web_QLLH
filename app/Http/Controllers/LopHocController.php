<?php

namespace App\Http\Controllers;

use App\Models\LopHoc;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreLopHocRequest;
use App\Http\Requests\UpdateLopHocRequest;

class LopHocController extends Controller
{
    /**
     * Các cột được phép sắp xếp.
     *
     * Chỉ cho phép các cột nằm trong danh sách này
     * để tránh lấy trực tiếp tên cột từ URL.
     */
    private const SORTABLE = [
        'id',
        'ma_lop',
        'ten_lop',
        'giao_vien',
        'si_so',
        'trang_thai',
    ];

    /**
     * Các lựa chọn số dòng trên mỗi trang.
     */
    private const PER_PAGE_OPTIONS = [10, 25, 50];

    /**
     * Hiển thị danh sách lớp học.
     */
    public function index(Request $request)
    {
        /*
         * ==========================
         * 1. VALIDATION
         * ==========================
         */

        $siSoMaxRules = [
            'nullable',
            'integer',
            'min:1',
        ];

        // Nếu người dùng nhập sĩ số từ,
        // sĩ số đến phải >= sĩ số từ.
        if ($request->filled('si_so_min')) {
            $siSoMaxRules[] = 'gte:si_so_min';
        }

        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'trang_thai' => [
                'nullable',
                Rule::in(['0', '1']),
            ],

            'si_so_min' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'si_so_max' => $siSoMaxRules,

            'per_page' => [
                'nullable',
                'integer',
                Rule::in(self::PER_PAGE_OPTIONS),
            ],

            'sort_by' => [
                'nullable',
                Rule::in(self::SORTABLE),
            ],

            'sort_dir' => [
                'nullable',
                Rule::in(['asc', 'desc']),
            ],
        ], [
            'search.max' =>
            'Từ khóa tìm kiếm không được vượt quá 100 ký tự.',

            'si_so_min.integer' =>
            'Sĩ số từ phải là số nguyên.',

            'si_so_min.min' =>
            'Sĩ số từ phải lớn hơn hoặc bằng 1.',

            'si_so_max.integer' =>
            'Sĩ số đến phải là số nguyên.',

            'si_so_max.min' =>
            'Sĩ số đến phải lớn hơn hoặc bằng 1.',

            'si_so_max.gte' =>
            'Sĩ số đến phải lớn hơn hoặc bằng sĩ số từ.',

            'per_page.in' =>
            'Số dòng mỗi trang chỉ được chọn 10, 25 hoặc 50.',
        ]);

        /*
         * ==========================
         * 2. CHUẨN HÓA INPUT
         * ==========================
         */

        $search = trim($filters['search'] ?? '');

        $perPage = (int) ($filters['per_page'] ?? 10);

        $sortBy = $filters['sort_by'] ?? 'id';

        $sortDir = $filters['sort_dir'] ?? 'asc';

        /*
         * ==========================
         * 3. BUILD QUERY
         * ==========================
         */

        $query = LopHoc::query()

            // Tìm kiếm theo mã lớp, tên lớp, giáo viên.
            ->when($search !== '', function ($query) use ($search) {
                $keyword = "%{$search}%";

                $query->where(function ($q) use ($keyword) {
                    $q->where('ma_lop', 'like', $keyword)
                        ->orWhere('ten_lop', 'like', $keyword)
                        ->orWhere('giao_vien', 'like', $keyword);
                });
            })

            // Lọc theo trạng thái.
            ->when(
                isset($filters['trang_thai']),
                function ($query) use ($filters) {
                    $query->where(
                        'trang_thai',
                        (int) $filters['trang_thai']
                    );
                }
            )

            // Lọc sĩ số tối thiểu.
            ->when(
                isset($filters['si_so_min']),
                function ($query) use ($filters) {
                    $query->where(
                        'si_so',
                        '>=',
                        (int) $filters['si_so_min']
                    );
                }
            )

            // Lọc sĩ số tối đa.
            ->when(
                isset($filters['si_so_max']),
                function ($query) use ($filters) {
                    $query->where(
                        'si_so',
                        '<=',
                        (int) $filters['si_so_max']
                    );
                }
            );

        /*
         * ==========================
         * 4. SORT + PAGINATION
         * ==========================
         */

        $lopHocs = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        /*
         * ==========================
         * 5. RETURN VIEW
         * ==========================
         */

        return view('lophoc.index', [
            'title' => 'Danh sách lớp học',
            'lophocs' => $lopHocs,
            'filters' => $filters,
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
            'perPage' => $perPage,
            'sortable' => self::SORTABLE,
            'perPageOptions' => self::PER_PAGE_OPTIONS,
        ]);
    }

    public function create()
    {
        return view('lophoc.create', [
            'title' => 'Thêm lớp học'
        ]);
    }

    public function show($id)
    {
        $lophoc = LopHoc::findOrFail($id);
        return view('lophoc.show', [
            'title'  => 'Chi tiết lớp học',
            'lophoc' => $lophoc
        ]);
    }

    // 
    public function store(StoreLopHocRequest $request)
    {

        // Cách 2 : khởi tạo đối tượng mới và gán giá trị cho từng thuộc tính từ tên của input
        // $lophoc = new LopHoc();
        // $lophoc->ten_lop = $request->input('ten_lop');
        // $lophoc->ma_lop = $request->input('ma_lop');
        // $lophoc->giao_vien = $request->input('giao_vien');
        // $lophoc->ghi_chu = $request->input('ghi_chu');
        // $lophoc->si_so = $request->input('si_so');
        // $lophoc->trang_thai = $request->input('trang_thai', 0); // mặc định là 0 nếu không có giá trị
        // $lophoc->save();

        try {
            // Cách 1 : dùng phương thức create() của Model LopHoc
            // LopHoc::create($request->all()); // $request->all() trả về tất cả dữ liệu từ form gửi lên
            // validated() chỉ trả về các trường có khai báo rule.
            LopHoc::create($request->validated());

            return redirect()->route('lophoc.index')
                ->with('success', 'Thêm lớp học thành công!');
        } catch (\Illuminate\Database\QueryException $e) {
            return redirect()->back()->withInput()->withErrors(['error' => 'Lỗi khi thêm mới lớp học: ' . $e->getMessage()]);
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->withErrors(['error' => 'Lỗi khi thêm mới lớp học: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $lophoc = LopHoc::findOrFail($id);

        return view('lophoc.edit', [
            'title'  => 'Sửa lớp học',
            'lophoc' => $lophoc
        ]);
    }
    public function update(UpdateLopHocRequest $request, $id)
    {
        $lophoc = LopHoc::findOrFail($id);

        $lophoc->update($request->validated());

        return redirect()->route('lophoc.index')
            ->with('success', 'Cập nhật lớp học thành công!');
    }

    public function destroy($id)
    {
        $lophoc = LopHoc::findOrFail($id);
        $lophoc->delete();

        // back() để giữ nguyên bộ lọc/sắp xếp đang xem
        return back()->with('success', 'Lớp học đã được xóa.');
    }
}
