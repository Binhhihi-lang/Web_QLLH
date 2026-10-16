@extends('layouts.layoutmaster')

@push('styles')
<style>
    .list-page { max-width: 1500px; margin: 0 auto; }
    .list-header, .list-heading, .filter-actions, .result-footer, .row-actions { display: flex; align-items: center; }
    .list-header { justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
    .list-heading { align-items: flex-start; flex-direction: column; gap: .25rem; }
    .list-title { color: var(--navy); font-size: 1.7rem; margin: 0; }
    .list-subtitle { color: var(--ink-muted); font-size: .9rem; margin: 0; }
    .primary-link, .filter-button, .reset-link { border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: .875rem; font-weight: 600; min-height: 40px; padding: .55rem .9rem; text-decoration: none; }
    .primary-link, .filter-button { background: var(--navy); border: 1px solid var(--navy); color: #fff; }
    .primary-link:hover, .filter-button:hover { background: var(--navy-2); border-color: var(--navy-2); color: #fff; }
    .filter-card, .table-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); }
    .filter-card { margin-bottom: 1rem; padding: 1.15rem; }
    .filter-grid { display: grid; gap: .9rem; grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(140px, 1fr)); }
    .field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
    .field label { color: var(--ink); font-size: .8rem; font-weight: 600; }
    .field input, .field select { background: #fff; border: 1px solid #d8dce3; border-radius: 6px; color: var(--ink); font: inherit; font-size: .875rem; min-height: 40px; padding: .5rem .65rem; width: 100%; }
    .field input:focus, .field select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgb(201 162 39 / 15%); outline: 0; }
    .filter-actions { gap: .6rem; margin-top: 1rem; }
    .reset-link { background: #fff; border: 1px solid #d8dce3; color: var(--ink); }
    .reset-link:hover { background: var(--paper-2); color: var(--ink); }
    .validation-alert { background: #fff4f2; border: 1px solid #efc5bf; border-radius: 7px; color: #8f2820; margin-bottom: 1rem; padding: .8rem 1rem; }
    .validation-alert ul { margin: .35rem 0 0; padding-left: 1.2rem; }
    .table-card { overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .data-table { border-collapse: collapse; font-size: .86rem; min-width: 860px; width: 100%; }
    .data-table th, .data-table td { border-bottom: 1px solid #edf0f3; padding: .8rem .9rem; text-align: left; vertical-align: middle; }
    .data-table th { background: #f7f8fa; color: #454c57; font-size: .76rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
    .data-table tbody tr:hover { background: #fbfcfd; }
    .sort-link { color: inherit; text-decoration: none; }
    .sort-link:hover { color: var(--navy); }
    .sort-arrow { color: var(--gold); margin-left: .2rem; }
    .user-name { color: var(--navy); font-weight: 600; }
    .status-pill { border-radius: 999px; display: inline-flex; font-size: .75rem; font-weight: 600; padding: .28rem .6rem; white-space: nowrap; }
    .status-active { background: #e7f5ec; color: #216d3a; }
    .status-inactive { background: #fcebea; color: #963b36; }
    .role-pill { border-radius: 999px; display: inline-flex; font-size: .75rem; font-weight: 600; padding: .28rem .6rem; white-space: nowrap; }
    .role-admin { background: #fff4e0; color: #8a6a0e; }
    .role-gv { background: #eaf1fb; color: #2a4f86; }
    .self-badge { color: var(--ink-muted); font-size: .74rem; font-weight: 500; margin-left: .3rem; }
    .row-actions { gap: .4rem; }
    .action-link, .delete-button { background: #fff; border: 1px solid #d8dce3; border-radius: 5px; color: var(--ink); cursor: pointer; font: inherit; font-size: .78rem; padding: .35rem .55rem; text-decoration: none; }
    .action-link:hover { background: #f2f5f9; color: var(--navy); }
    .delete-button { border-color: #e8c5c2; color: #9c3028; }
    .delete-button:hover { background: #fff4f2; }
    .delete-button[disabled] { cursor: not-allowed; opacity: .45; }
    .empty-state { color: var(--ink-muted); padding: 2rem !important; text-align: center !important; }
    .result-footer { justify-content: space-between; gap: 1rem; margin-top: 1rem; }
    .result-summary { color: var(--ink-muted); font-size: .85rem; margin: 0; }
    .result-summary strong { color: var(--ink); }
    .result-pagination nav, .result-pagination .pagination { margin: 0; }
    @media (max-width: 1050px) { .filter-grid { grid-template-columns: repeat(2, minmax(150px, 1fr)); } }
    @media (max-width: 650px) {
        .list-header { align-items: flex-start; flex-direction: column; }
        .filter-grid { grid-template-columns: 1fr; }
        .filter-actions { align-items: stretch; flex-direction: column; }
        .filter-actions > * { width: 100%; }
        .result-footer { align-items: flex-start; flex-direction: column; }
        .result-pagination { max-width: 100%; overflow-x: auto; }
    }
</style>
@endpush

@section('content')
@php
    $sortUrl = fn (string $column) => request()->fullUrlWithQuery([
        'sort_by' => $column,
        'sort_dir' => $sortBy === $column && $sortDir === 'asc' ? 'desc' : 'asc',
        'page' => 1,
    ]);
    $sortLabel = fn (string $column) => $sortBy === $column ? ($sortDir === 'asc' ? '↑' : '↓') : '↕';
@endphp

<section class="list-page">
    <div class="list-header">
        <div class="list-heading">
            <h1 class="list-title">Danh sách người dùng</h1>
            <p class="list-subtitle">Quản lý tài khoản quản trị viên và giảng viên.</p>
        </div>
        <a href="{{ route('nguoidung.create') }}" class="primary-link">+ Thêm người dùng</a>
    </div>

    @if ($errors->any())
        <div class="validation-alert" role="alert" aria-live="polite">
            <strong>Vui lòng kiểm tra lại:</strong>
            <ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
        </div>
    @endif

    <section class="filter-card" aria-label="Bộ lọc người dùng">
        <form method="GET" action="{{ route('nguoidung.index') }}">
            <input type="hidden" name="sort_by" value="{{ $sortBy }}">
            <input type="hidden" name="sort_dir" value="{{ $sortDir }}">
            <input type="hidden" name="page" value="1">

            <div class="filter-grid">
                <div class="field">
                    <label for="search">Từ khóa</label>
                    <input id="search" type="search" name="search" value="{{ request('search') }}" placeholder="Họ tên hoặc email">
                </div>
                <div class="field">
                    <label for="vai_tro">Vai trò</label>
                    <select id="vai_tro" name="vai_tro">
                        <option value="">Tất cả vai trò</option>
                        @foreach ($vaiTroOptions as $key => $label)
                            <option value="{{ $key }}" {{ request('vai_tro') === $key ? 'selected' : '' }}>{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="field">
                    <label for="trang_thai">Trạng thái</label>
                    <select id="trang_thai" name="trang_thai">
                        <option value="">Tất cả trạng thái</option>
                        <option value="1" {{ request('trang_thai') === '1' ? 'selected' : '' }}>Đang hoạt động</option>
                        <option value="0" {{ request('trang_thai') === '0' ? 'selected' : '' }}>Đã khóa</option>
                    </select>
                </div>
                <div class="field">
                    <label for="per_page">Số dòng / trang</label>
                    <select id="per_page" name="per_page">
                        @foreach ($perPageOptions as $size)
                            <option value="{{ $size }}" {{ $perPage === $size ? 'selected' : '' }}>{{ $size }} dòng</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="filter-actions">
                <button type="submit" class="filter-button">Áp dụng bộ lọc</button>
                <a href="{{ route('nguoidung.index') }}" class="reset-link">Xóa bộ lọc</a>
            </div>
        </form>
    </section>

    <section class="table-card" aria-label="Kết quả người dùng">
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th><a class="sort-link" href="{{ $sortUrl('id') }}">ID <span class="sort-arrow">{{ $sortLabel('id') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('name') }}">Họ tên <span class="sort-arrow">{{ $sortLabel('name') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('email') }}">Email <span class="sort-arrow">{{ $sortLabel('email') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('vai_tro') }}">Vai trò <span class="sort-arrow">{{ $sortLabel('vai_tro') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('trang_thai') }}">Trạng thái <span class="sort-arrow">{{ $sortLabel('trang_thai') }}</span></a></th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($nguoiDungs as $nguoiDung)
                        @php $laChinhMinh = $nguoiDung->id === auth()->id(); @endphp
                        <tr>
                            <td>{{ $nguoiDung->id }}</td>
                            <td>
                                <span class="user-name">{{ $nguoiDung->name }}</span>
                                @if ($laChinhMinh)<span class="self-badge">(bạn)</span>@endif
                            </td>
                            <td>{{ $nguoiDung->email }}</td>
                            <td>
                                <span class="role-pill {{ $nguoiDung->laAdmin() ? 'role-admin' : 'role-gv' }}">
                                    {{ $nguoiDung->tenVaiTro() }}
                                </span>
                            </td>
                            <td>
                                <span class="status-pill {{ $nguoiDung->trang_thai ? 'status-active' : 'status-inactive' }}">
                                    {{ $nguoiDung->trang_thai ? 'Đang hoạt động' : 'Đã khóa' }}
                                </span>
                            </td>
                            <td>
                                <div class="row-actions">
                                    <a href="{{ route('nguoidung.edit', $nguoiDung->id) }}" class="action-link">Sửa</a>
                                    <form action="{{ route('nguoidung.destroy', $nguoiDung->id) }}" method="POST"
                                          onsubmit="return confirm('Bạn có chắc muốn xóa tài khoản {{ $nguoiDung->name }} không?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="delete-button" @disabled($laChinhMinh)
                                                title="{{ $laChinhMinh ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa' }}">Xóa</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td class="empty-state" colspan="6">Không tìm thấy người dùng phù hợp với bộ lọc.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <div class="result-footer">
        <p class="result-summary">
            Hiển thị <strong>{{ $nguoiDungs->firstItem() ?? 0 }}–{{ $nguoiDungs->lastItem() ?? 0 }}</strong>
            trong tổng số <strong>{{ $nguoiDungs->total() }}</strong> người dùng
        </p>
        <div class="result-pagination">{{ $nguoiDungs->links('vendor.pagination.app-bootstrap') }}</div>
    </div>
</section>
@endsection
