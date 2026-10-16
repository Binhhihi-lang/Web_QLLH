<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNguoiDungRequest;
use App\Http\Requests\UpdateNguoiDungRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class NguoiDungController extends Controller
{
    /**
     * Các cột được phép sắp xếp.
     */
    private const SORTABLE = [
        'id',
        'name',
        'email',
        'vai_tro',
        'trang_thai',
    ];

    private const PER_PAGE_OPTIONS = [10, 25, 50];

    /**
     * Danh sách người dùng.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'vai_tro' => ['nullable', Rule::in(array_keys(User::VAI_TRO))],
            'trang_thai' => ['nullable', Rule::in(['0', '1'])],
            'per_page' => ['nullable', 'integer', Rule::in(self::PER_PAGE_OPTIONS)],
            'sort_by' => ['nullable', Rule::in(self::SORTABLE)],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ], [
            'search.max' => 'Từ khóa tìm kiếm không được vượt quá 100 ký tự.',
            'vai_tro.in' => 'Vai trò không hợp lệ.',
            'per_page.in' => 'Số dòng mỗi trang chỉ được chọn 10, 25 hoặc 50.',
        ]);

        $search = trim($filters['search'] ?? '');
        $perPage = (int) ($filters['per_page'] ?? 10);
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $nguoiDungs = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $keyword = "%{$search}%";
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', $keyword)
                        ->orWhere('email', 'like', $keyword);
                });
            })
            ->when(isset($filters['vai_tro']), fn ($q) => $q->where('vai_tro', $filters['vai_tro']))
            ->when(isset($filters['trang_thai']), fn ($q) => $q->where('trang_thai', (int) $filters['trang_thai']))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return view('nguoidung.index', [
            'title' => 'Danh sách người dùng',
            'nguoiDungs' => $nguoiDungs,
            'filters' => $filters,
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
            'perPage' => $perPage,
            'sortable' => self::SORTABLE,
            'perPageOptions' => self::PER_PAGE_OPTIONS,
            'vaiTroOptions' => User::VAI_TRO,
        ]);
    }

    /**
     * Form thêm người dùng.
     */
    public function create()
    {
        return view('nguoidung.create', [
            'title' => 'Thêm người dùng',
            'vaiTroOptions' => User::VAI_TRO,
        ]);
    }

    /**
     * Lưu người dùng mới.
     */
    public function store(StoreNguoiDungRequest $request)
    {
        try {
            User::create($request->validated());

            return redirect()->route('nguoidung.index')
                ->with('success', 'Thêm người dùng thành công!');
        } catch (\Exception $e) {
            return redirect()->back()->withInput()
                ->withErrors(['error' => 'Lỗi khi thêm người dùng: ' . $e->getMessage()]);
        }
    }

    /**
     * Form sửa người dùng.
     */
    public function edit($id)
    {
        $nguoiDung = User::findOrFail($id);

        return view('nguoidung.edit', [
            'title' => 'Sửa người dùng',
            'nguoiDung' => $nguoiDung,
            'vaiTroOptions' => User::VAI_TRO,
        ]);
    }

    /**
     * Cập nhật người dùng.
     */
    public function update(UpdateNguoiDungRequest $request, $id)
    {
        $nguoiDung = User::findOrFail($id);
        $duLieu = $request->validated();

        // Để trống mật khẩu nghĩa là giữ nguyên mật khẩu cũ.
        if (empty($duLieu['password'])) {
            unset($duLieu['password']);
        }

        $nguoiDung->update($duLieu);

        return redirect()->route('nguoidung.index')
            ->with('success', 'Cập nhật người dùng thành công!');
    }

    /**
     * Xóa người dùng.
     */
    public function destroy($id)
    {
        $nguoiDung = User::findOrFail($id);

        if ($nguoiDung->id === Auth::id()) {
            return back()->withErrors(['error' => 'Bạn không thể xóa tài khoản đang đăng nhập.']);
        }

        $nguoiDung->delete();

        return back()->with('success', 'Đã xóa người dùng thành công!');
    }
}
