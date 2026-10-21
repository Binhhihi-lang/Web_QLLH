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
    .filter-grid { display: grid; gap: .9rem; grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(130px, 1fr)); }
    .field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
    .field label { color: var(--ink); font-size: .8rem; font-weight: 600; }
    .field input, .field select { background: #fff; border: 1px solid #d8dce3; border-radius: 6px; color: var(--ink); font: inherit; font-size: .875rem; min-height: 40px; padding: .5rem .65rem; width: 100%; }
    .field input:focus, .field select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgb(201 162 39 / 15%); outline: 0; }
    .field-hint { color: var(--ink-muted); font-size: .74rem; }
    .field-error { color: #a32626; font-size: .76rem; }
    .filter-actions { gap: .6rem; margin-top: 1rem; }
    .reset-link { background: #fff; border: 1px solid #d8dce3; color: var(--ink); }
    .reset-link:hover { background: var(--paper-2); color: var(--ink); }
    .validation-alert { background: #fff4f2; border: 1px solid #efc5bf; border-radius: 7px; color: #8f2820; margin-bottom: 1rem; padding: .8rem 1rem; }
    .validation-alert ul { margin: .35rem 0 0; padding-left: 1.2rem; }
    .table-card { overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .data-table { border-collapse: collapse; font-size: .86rem; min-width: 920px; width: 100%; }
    .data-table th, .data-table td { border-bottom: 1px solid #edf0f3; padding: .8rem .9rem; text-align: left; vertical-align: middle; }
    .data-table th { background: #f7f8fa; color: #454c57; font-size: .76rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
    .data-table tbody tr:hover { background: #fbfcfd; }
    .sort-link { color: inherit; text-decoration: none; }
    .sort-link:hover { color: var(--navy); }
    .sort-arrow { color: var(--gold); margin-left: .2rem; }
    .class-name { color: var(--navy); font-weight: 600; text-decoration: none; }
    .class-name:hover { text-decoration: underline; }
    .status-pill { border-radius: 999px; display: inline-flex; font-size: .75rem; font-weight: 600; padding: .28rem .6rem; white-space: nowrap; }
    .status-active { background: #e7f5ec; color: #216d3a; }
    .status-inactive { background: #fcebea; color: #963b36; }
    .row-actions { gap: .4rem; }
    .action-link, .delete-button { background: #fff; border: 1px solid #d8dce3; border-radius: 5px; color: var(--ink); cursor: pointer; font: inherit; font-size: .78rem; padding: .35rem .55rem; text-decoration: none; }
    .action-link:hover { background: #f2f5f9; color: var(--navy); }
    .delete-button { border-color: #e8c5c2; color: #9c3028; }
    .delete-button:hover { background: #fff4f2; }
    .empty-state { color: var(--ink-muted); padding: 2rem !important; text-align: center !important; }
    .result-footer { justify-content: space-between; gap: 1rem; margin-top: 1rem; }
    .result-summary { color: var(--ink-muted); font-size: .85rem; margin: 0; }
    .result-summary strong { color: var(--ink); }
    .result-pagination nav { margin: 0; }
    .result-pagination .pagination { margin: 0; }
    @media (max-width: 1050px) { .filter-grid { grid-template-columns: repeat(3, minmax(150px, 1fr)); } }
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
    $sortBy = request('sort_by', 'id');
    $sortDir = request('sort_dir', 'asc');
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
            <h1 class="list-title">Danh sách lớp học</h1>
            <p class="list-subtitle">Tìm kiếm, lọc sĩ số và quản lý các lớp học.</p>
        </div>
        <a href="{{ route('lophoc.create') }}" class="primary-link">+ Thêm lớp học</a>
    </div>

    @if ($errors->any())
        <div class="validation-alert" role="alert" aria-live="polite">
            <strong>Vui lòng kiểm tra lại bộ lọc:</strong>
            <ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
        </div>
    @endif

    <section class="filter-card" aria-label="Bộ lọc lớp học">
        <form method="GET" action="{{ route('lophoc.index') }}">
            <input type="hidden" name="sort_by" value="{{ request('sort_by', 'id') }}">
            <input type="hidden" name="sort_dir" value="{{ request('sort_dir', 'asc') }}">
            <input type="hidden" name="page" value="1">

            <div class="filter-grid">
                <div class="field">
                    <label for="search">Từ khóa</label>
                    <input id="search" type="search" name="search" value="{{ request('search') }}" placeholder="Tên lớp, mã lớp, giáo viên">
                </div>
                <div class="field">
                    <label for="trang_thai">Trạng thái</label>
                    <select id="trang_thai" name="trang_thai">
                        <option value="">Tất cả trạng thái</option>
                        <option value="1" {{ request('trang_thai') === '1' ? 'selected' : '' }}>Đang hoạt động</option>
                        <option value="0" {{ request('trang_thai') === '0' ? 'selected' : '' }}>Ngừng hoạt động</option>
                    </select>
                </div>
                <div class="field">
                    <label for="si_so_min">Sĩ số từ</label>
                    <input id="si_so_min" type="number" name="si_so_min" min="1" step="1" value="{{ request('si_so_min') }}" placeholder="Ví dụ: 20" aria-describedby="si-so-help">
                </div>
                <div class="field">
                    <label for="si_so_max">Sĩ số đến</label>
                    <input id="si_so_max" type="number" name="si_so_max" min="1" step="1" value="{{ request('si_so_max') }}" placeholder="Ví dụ: 40" aria-describedby="si-so-help">
                </div>
                <div class="field">
                    <label for="per_page">Số dòng / trang</label>
                    <select id="per_page" name="per_page">
                        @foreach ([10, 25, 50] as $size)
                            <option value="{{ $size }}" {{ (int) request('per_page', 10) === $size ? 'selected' : '' }}>{{ $size }} dòng</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <small class="field-hint" id="si-so-help">Nhập một đầu mút hoặc cả hai. Khoảng lọc tính cả hai giá trị; sĩ số phải từ 1 trở lên.</small>
            @error('si_so_min') <div class="field-error">{{ $message }}</div> @enderror
            @error('si_so_max') <div class="field-error">{{ $message }}</div> @enderror
            <div class="filter-actions">
                <button type="submit" class="filter-button">Áp dụng bộ lọc</button>
                <a href="{{ route('lophoc.index') }}" class="reset-link">Xóa bộ lọc</a>
            </div>
        </form>
    </section>

    <section class="table-card" aria-label="Kết quả lớp học">
        <div class="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        <th><a class="sort-link" href="{{ $sortUrl('id') }}">ID <span class="sort-arrow">{{ $sortLabel('id') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('ten_lop') }}">Tên lớp <span class="sort-arrow">{{ $sortLabel('ten_lop') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('ma_lop') }}">Mã lớp <span class="sort-arrow">{{ $sortLabel('ma_lop') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('giao_vien') }}">Giáo viên <span class="sort-arrow">{{ $sortLabel('giao_vien') }}</span></a></th>
                        <th>SĐT GVCN</th>
                        <th>Ghi chú</th>
                        <th><a class="sort-link" href="{{ $sortUrl('si_so') }}">Sĩ số <span class="sort-arrow">{{ $sortLabel('si_so') }}</span></a></th>
                        <th><a class="sort-link" href="{{ $sortUrl('trang_thai') }}">Trạng thái <span class="sort-arrow">{{ $sortLabel('trang_thai') }}</span></a></th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($lophocs as $lop)
                        <tr>
                            <td>{{ $lop->id }}</td>
                            <td><a class="class-name" href="{{ route('lophoc.show', $lop->id) }}">{{ $lop->ten_lop }}</a></td>
                            <td>{{ $lop->ma_lop }}</td>
                            <td>{{ $lop->giao_vien }}</td>
                            <td>{{ $lop->so_dien_thoai_gvcn ?: '—' }}</td>
                            <td>{{ $lop->ghi_chu ?: '—' }}</td>
                            <td>{{ $lop->si_so }}</td>
                            <td><span class="status-pill {{ $lop->trang_thai ? 'status-active' : 'status-inactive' }}">{{ $lop->trang_thai ? 'Đang hoạt động' : 'Ngừng hoạt động' }}</span></td>
                            <td>
                                <div class="row-actions">
                                    <a href="{{ route('lophoc.edit', $lop->id) }}" class="action-link">Sửa</a>
                                    <form action="{{ route('lophoc.destroy', $lop->id) }}" method="POST" onsubmit="return confirm('Bạn có chắc muốn xóa lớp {{ $lop->ten_lop }} không?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="delete-button">Xóa</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td class="empty-state" colspan="9">Không tìm thấy lớp học phù hợp với bộ lọc.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <div class="result-footer">
        <p class="result-summary">
            Hiển thị <strong>{{ $lophocs->firstItem() ?? 0 }}–{{ $lophocs->lastItem() ?? 0 }}</strong>
            trong tổng số <strong>{{ $lophocs->total() }}</strong> lớp học
        </p>
        <div class="result-pagination">{{ $lophocs->links('vendor.pagination.app-bootstrap') }}</div>
    </div>
</section>
@endsection
