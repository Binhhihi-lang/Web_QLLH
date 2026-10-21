<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreMenuRequest;
use App\Http\Requests\UpdateMenuRequest;

class MenuController extends Controller
{
    private const SORTABLE = ['id', 'ten', 'url', 'vi_tri', 'thu_tu', 'trang_thai'];

    private const PER_PAGE_OPTIONS = [10, 25, 50];

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'trang_thai' => ['nullable', Rule::in(['0', '1'])],
            'vi_tri' => ['nullable', Rule::in(array_keys(Menu::VI_TRI))],
            'vai_tro' => ['nullable', Rule::in(array_keys(Menu::VAI_TRO))],
            'per_page' => ['nullable', 'integer', Rule::in(self::PER_PAGE_OPTIONS)],
            'sort_by' => ['nullable', Rule::in(self::SORTABLE)],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ], [
            'search.max' => 'Từ khóa tìm kiếm không được vượt quá 100 ký tự.',
            'vi_tri.in' => 'Vị trí không hợp lệ.',
            'vai_tro.in' => 'Vai trò không hợp lệ.',
            'per_page.in' => 'Số dòng mỗi trang chỉ được chọn 10, 25 hoặc 50.',
        ]);

        $search = trim($filters['search'] ?? '');
        $perPage = (int) ($filters['per_page'] ?? 10);
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $menus = Menu::query()
            ->when($search !== '', function ($query) use ($search) {
                $keyword = "%{$search}%";
                $query->where(function ($q) use ($keyword) {
                    $q->where('ten', 'like', $keyword)
                        ->orWhere('url', 'like', $keyword);
                });
            })
            ->when(isset($filters['trang_thai']), fn ($q) => $q->where('trang_thai', (int) $filters['trang_thai']))
            ->when(isset($filters['vi_tri']), fn ($q) => $q->where('vi_tri', $filters['vi_tri']))
            ->when(
                isset($filters['vai_tro']),
                fn ($q) => $q->where('vai_tro', $filters['vai_tro'])
            )
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return view('menu.index', [
            'title' => 'Danh sách Menu',
            'menus' => $menus,
            'filters' => $filters,
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
            'perPage' => $perPage,
            'viTriOptions' => Menu::VI_TRI,
            'vaiTroOptions' => Menu::VAI_TRO,
        ]);
    }

    public function create()
    {
        return view('menu.create', [
            'title'        => 'Thêm Menu',
            'viTriOptions' => Menu::VI_TRI,
            'vaiTroOptions' => Menu::VAI_TRO,
        ]);
    }

    public function store(StoreMenuRequest $request)
    {
        try {
            Menu::create($request->validated());

            return redirect()->route('menu.index')
                ->with('success', 'Thêm menu thành công!');
        } catch (\Exception $e) {
            return redirect()->back()->withInput()
                ->withErrors(['error' => 'Lỗi khi thêm menu: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $menu = Menu::findOrFail($id);
        return view('menu.edit', [
            'title'        => 'Sửa Menu',
            'menu'         => $menu,
            'viTriOptions' => Menu::VI_TRI,
            'vaiTroOptions' => Menu::VAI_TRO,
        ]);
    }

    public function update(UpdateMenuRequest $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $menu->update($request->validated());

        return redirect()->route('menu.index')
            ->with('success', 'Cập nhật menu thành công!');
    }

    public function destroy($id)
    {
        $menu = Menu::findOrFail($id);
        $menu->delete();

        return redirect()->route('menu.index')
            ->with('success', 'Đã xóa menu thành công!');
    }
}
