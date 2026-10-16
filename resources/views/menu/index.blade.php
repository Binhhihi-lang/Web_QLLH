@extends('layouts.layoutmaster')

@push('styles')
<style>
    table{ border-collapse: collapse; width: 100%; }
    th, td{ text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); }
    th{ background-color: var(--navy); color: #F5F1E8; white-space: nowrap; }
    tr:nth-child(even){ background-color: var(--paper-2); }
    .badge{ display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:600; }
    .badge-active{ background:#DFF3E3; color:#1E7B3C; }
    .badge-inactive{ background:#FBEAEA; color:#A33; }

    .table-toolbar{ display:flex; align-items:center; gap:10px; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; }
    .filter-form{ display:flex; gap:8px; flex-wrap:wrap; flex:1; }
    .filter-form input[type="text"], .filter-form select{
        padding:8px 12px; border:1px solid var(--line); border-radius:8px;
        background:#fff; color:var(--ink); font-size:13px; font-family:'Inter', sans-serif; outline:none; transition:border-color .15s;
    }
    .filter-form input[type="text"]:focus, .filter-form select:focus{ border-color:var(--gold); }
    .filter-form input[type="text"]{ min-width:220px; }
    .btn-filter{ padding:8px 16px; border:none; border-radius:8px; background:var(--navy); color:#F5F1E8; font-size:13px; font-weight:600; cursor:pointer; font-family:'Inter', sans-serif; transition:background .15s; }
    .btn-filter:hover{ background:var(--navy-2); }
    .btn-reset{ padding:8px 14px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--ink-muted); font-size:13px; cursor:pointer; font-family:'Inter', sans-serif; transition:border-color .15s; text-decoration:none; display:inline-flex; align-items:center; }
    .btn-reset:hover{ border-color:var(--gold); color:var(--ink); }
    .btn-add{ display:inline-flex; align-items:center; gap:6px; background: var(--navy); color:#F5F1E8; border:none; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:600; text-decoration:none; transition:background .15s ease; white-space:nowrap; }
    .btn-add:hover{ background: var(--navy-2); }

    th a.sort-link{ color:#F5F1E8; text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
    th a.sort-link:hover{ color:var(--gold); }
    th a.sort-link .arrow{ font-size:11px; opacity:.6; }
    th a.sort-link.active-asc .arrow::after  { content:'▲'; opacity:1; color:var(--gold); }
    th a.sort-link.active-desc .arrow::after { content:'▼'; opacity:1; color:var(--gold); }
    th a.sort-link:not(.active-asc):not(.active-desc) .arrow::after { content:'⇅'; }

    .per-page-select{ padding:8px 12px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--ink); font-size:13px; font-family:'Inter', sans-serif; cursor:pointer; outline:none; }
    .per-page-select:hover{ border-color:var(--gold); }

    .action-group{ display:flex; gap:8px; }
    .btn-edit, .btn-delete{ display:inline-flex; align-items:center; justify-content:center; padding:6px 14px; border-radius:6px; font-size:12.5px; font-weight:600; text-decoration:none; border:1px solid transparent; cursor:pointer; font-family:'Inter', sans-serif; }
    .btn-edit{ background:#FFF6E4; color:#8A6A0E; border-color:#E9D6A0; }
    .btn-edit:hover{ background:#FCEBC4; }
    .btn-delete{ background:#FBEAEA; color:#A33; border-color:#E8B4B4; }
    .btn-delete:hover{ background:#F6D6D6; }

    .table-footer{ display:flex; align-items:center; justify-content:space-between; margin-top:16px; flex-wrap:wrap; gap:10px; }
    .result-count{ font-size:12.5px; color:var(--ink-muted); }
    .slug-chip{ font-family:'JetBrains Mono', monospace; font-size:12px; background:var(--paper-2); border:1px solid var(--line); border-radius:5px; padding:2px 7px; color:var(--navy-2); }
</style>
@endpush

@section('content')
    <div class="page-title">Danh sách Menu</div>
    <div class="page-sub">Quản lý các mục menu hiển thị trong hệ thống.</div>

    <div class="table-toolbar">
        <form class="filter-form" method="GET" action="{{ route('menu.index') }}">
            <input type="hidden" name="per_page" value="{{ request('per_page', 10) }}">
            <input type="hidden" name="sort_by"  value="{{ request('sort_by', 'id') }}">
            <input type="hidden" name="sort_dir" value="{{ request('sort_dir', 'asc') }}">

            <input type="text" name="search"
                   value="{{ request('search') }}"
                   placeholder="Tìm tên, đường dẫn…">

            <select name="vi_tri">
                <option value="">Tất cả vị trí</option>
                @foreach ($viTriOptions as $key => $label)
                    <option value="{{ $key }}" {{ request('vi_tri') === $key ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>

            <select name="trang_thai">
                <option value="">Tất cả trạng thái</option>
                <option value="1" {{ request('trang_thai') === '1' ? 'selected' : '' }}>Đang hiển thị</option>
                <option value="0" {{ request('trang_thai') === '0' ? 'selected' : '' }}>Đã ẩn</option>
            </select>

            <select name="vai_tro">
                <option value="">Mọi vai trò</option>
                @foreach ($vaiTroOptions as $key => $label)
                    <option value="{{ $key }}" {{ request('vai_tro') === $key ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>

            <button type="submit" class="btn-filter">Lọc</button>

            @if(request()->hasAny(['search','trang_thai','vi_tri','vai_tro']))
                <a href="{{ route('menu.index') }}" class="btn-reset">✕ Xóa lọc</a>
            @endif
        </form>

        <a href="{{ route('menu.create') }}" class="btn-add">+ Thêm Menu</a>
    </div>

    @php
        $sortBy  = request('sort_by', 'id');
        $sortDir = request('sort_dir', 'asc');

        // Dùng closure thay vì function có tên: view có thể được render
        // nhiều lần trong cùng một tiến trình, khai báo function sẽ lỗi trùng tên.
        $sortUrl = fn (string $col) => request()->fullUrlWithQuery([
            'sort_by' => $col,
            'sort_dir' => ($sortBy === $col && $sortDir === 'asc') ? 'desc' : 'asc',
            'page' => 1,
        ]);

        $sortClass = function (string $col) use ($sortBy, $sortDir): string {
            if ($sortBy !== $col) {
                return '';
            }
            return $sortDir === 'asc' ? 'active-asc' : 'active-desc';
        };
    @endphp

    <table>
        <tr>
            <th><a href="{{ $sortUrl('id') }}" class="sort-link {{ $sortClass('id') }}">#<span class="arrow"></span></a></th>
            <th><a href="{{ $sortUrl('ten') }}" class="sort-link {{ $sortClass('ten') }}">Tên menu <span class="arrow"></span></a></th>
            <th><a href="{{ $sortUrl('url') }}" class="sort-link {{ $sortClass('url') }}">Đường dẫn <span class="arrow"></span></a></th>
            <th><a href="{{ $sortUrl('vi_tri') }}" class="sort-link {{ $sortClass('vi_tri') }}">Vị trí <span class="arrow"></span></a></th>
            <th>Nhóm</th>
            <th>Vai trò</th>
            <th><a href="{{ $sortUrl('thu_tu') }}" class="sort-link {{ $sortClass('thu_tu') }}">Thứ tự <span class="arrow"></span></a></th>
            <th><a href="{{ $sortUrl('trang_thai') }}" class="sort-link {{ $sortClass('trang_thai') }}">Trạng thái <span class="arrow"></span></a></th>
            <th>Thao tác</th>
        </tr>

        @forelse ($menus as $menu)
        <tr>
            <td>{{ $menu->id }}</td>
            <td>{{ $menu->ten }}</td>
            <td><span class="slug-chip">{{ $menu->url }}</span></td>
            <td>{{ $viTriOptions[$menu->vi_tri] ?? $menu->vi_tri }}</td>
            <td>{{ $menu->nhom ?: '—' }}</td>
            <td>{{ $menu->vai_tro ? ($vaiTroOptions[$menu->vai_tro] ?? $menu->vai_tro) : 'Mọi vai trò' }}</td>
            <td>{{ $menu->thu_tu }}</td>
            <td>
                @if ($menu->trang_thai)
                    <span class="badge badge-active">Đang hiển thị</span>
                @else
                    <span class="badge badge-inactive">Đã ẩn</span>
                @endif
            </td>
            <td>
                <div class="action-group">
                    <a href="{{ route('menu.edit', $menu->id) }}" class="btn-edit">Sửa</a>
                    <form action="{{ route('menu.destroy', $menu->id) }}" method="POST"
                          onsubmit="return confirm('Bạn có chắc muốn xóa menu {{ $menu->ten }} không?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn-delete">Xóa</button>
                    </form>
                </div>
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="9" style="text-align:center; color:var(--ink-muted); padding:24px;">
                Không tìm thấy menu nào.
            </td>
        </tr>
        @endforelse
    </table>

    <div class="table-footer">
        <span class="result-count">
            Hiển thị {{ $menus->firstItem() ?? 0 }}–{{ $menus->lastItem() ?? 0 }}
            / {{ $menus->total() }} menu
        </span>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <select class="per-page-select"
                onchange="
                    const url = new URL(window.location.href);
                    url.searchParams.set('per_page', this.value);
                    url.searchParams.delete('page');
                    window.location.href = url.toString();
                ">
                <option value="10" {{ request('per_page', 10) == 10 ? 'selected' : '' }}>10 / trang</option>
                <option value="25" {{ request('per_page') == 25 ? 'selected' : '' }}>25 / trang</option>
                <option value="50" {{ request('per_page') == 50 ? 'selected' : '' }}>50 / trang</option>
            </select>

            {{ $menus->links() }}
        </div>
    </div>
@endsection