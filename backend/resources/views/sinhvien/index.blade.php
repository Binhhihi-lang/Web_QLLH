@extends('layouts.layoutmaster')

@push('styles')
<style>
    .student-page { max-width: 1500px; margin: 0 auto; }
    .student-header, .student-heading, .student-actions, .student-result-footer, .student-row-actions { display: flex; align-items: center; }
    .student-header { justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
    .student-heading { align-items: flex-start; flex-direction: column; gap: .25rem; }
    .student-title { color: var(--navy); font-size: 1.7rem; margin: 0; }
    .student-subtitle { color: var(--ink-muted); font-size: .9rem; margin: 0; }
    .student-add, .student-filter-button, .student-reset { border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: .875rem; font-weight: 600; min-height: 40px; padding: .55rem .9rem; text-decoration: none; }
    .student-add, .student-filter-button { background: var(--navy); border: 1px solid var(--navy); color: #fff; }
    .student-add:hover, .student-filter-button:hover { background: var(--navy-2); border-color: var(--navy-2); color: #fff; }
    .student-filter-card, .student-table-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); }
    .student-filter-card { margin-bottom: 1rem; padding: 1.15rem; }
    .student-filter-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(150px, 1fr)); }
    .student-field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
    .student-field label { color: var(--ink); font-size: .8rem; font-weight: 600; }
    .student-field input, .student-field select { background: #fff; border: 1px solid #d8dce3; border-radius: 6px; color: var(--ink); font: inherit; font-size: .875rem; min-height: 40px; padding: .5rem .65rem; width: 100%; }
    .student-field input:focus, .student-field select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgb(201 162 39 / 15%); outline: 0; }
    .student-field-error { color: #a32626; font-size: .76rem; }
    .student-filter-actions { display: flex; gap: .6rem; margin-top: 1rem; }
    .student-reset { background: #fff; border: 1px solid #d8dce3; color: var(--ink); }
    .student-reset:hover { background: var(--paper-2); color: var(--ink); }
    .student-validation { background: #fff4f2; border: 1px solid #efc5bf; border-radius: 7px; color: #8f2820; margin-bottom: 1rem; padding: .8rem 1rem; }
    .student-validation ul { margin: .35rem 0 0; padding-left: 1.2rem; }
    .student-table-card { overflow: hidden; }
    .student-table-scroll { overflow-x: auto; }
    .student-table { border-collapse: collapse; font-size: .84rem; min-width: 1050px; width: 100%; }
    .student-table th, .student-table td { border-bottom: 1px solid #edf0f3; padding: .75rem .85rem; text-align: left; vertical-align: middle; }
    .student-table th { background: #f7f8fa; color: #454c57; font-size: .75rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
    .student-table tbody tr:hover { background: #fbfcfd; }
    .student-sort-link { color: inherit; text-decoration: none; white-space: nowrap; }
    .student-sort-link:hover { color: var(--navy); }
    .student-sort-arrow { color: var(--gold); margin-left: .2rem; }
    .student-code { color: var(--navy); font-family: 'JetBrains Mono', monospace; font-size: .78rem; text-decoration: none; white-space: nowrap; }
    .student-name { color: var(--ink); font-weight: 600; text-decoration: none; }
    .student-code:hover, .student-name:hover { text-decoration: underline; }
    .student-email { color: var(--ink-muted); }
    .student-pill { border-radius: 999px; display: inline-flex; font-size: .74rem; font-weight: 600; padding: .26rem .58rem; white-space: nowrap; }
    .student-active { background: #e7f5ec; color: #216d3a; }
    .student-inactive { background: #fcebea; color: #963b36; }
    .student-male { background: #eaf1fb; color: #315a91; }
    .student-female { background: #f9eaf0; color: #8c3d5b; }
    .student-row-actions { gap: .4rem; }
    .student-edit, .student-delete { background: #fff; border: 1px solid #d8dce3; border-radius: 5px; color: var(--ink); cursor: pointer; font: inherit; font-size: .78rem; padding: .35rem .55rem; text-decoration: none; }
    .student-edit:hover { background: #f2f5f9; color: var(--navy); }
    .student-delete { border-color: #e8c5c2; color: #9c3028; }
    .student-delete:hover { background: #fff4f2; }
    .student-empty { color: var(--ink-muted); padding: 2rem !important; text-align: center !important; }
    .student-result-footer { justify-content: space-between; gap: 1rem; margin-top: 1rem; }
    .student-result-summary { color: var(--ink-muted); font-size: .85rem; margin: 0; }
    .student-result-summary strong { color: var(--ink); }
    .student-pagination .pagination { margin: 0; }
    @media (max-width: 1050px) { .student-filter-grid { grid-template-columns: repeat(3, minmax(150px, 1fr)); } }
    @media (max-width: 700px) {
        .student-header { align-items: flex-start; flex-direction: column; }
        .student-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .student-filter-actions { align-items: stretch; flex-direction: column; }
        .student-filter-actions > * { width: 100%; }
        .student-result-footer { align-items: flex-start; flex-direction: column; }
        .student-pagination { max-width: 100%; overflow-x: auto; }
    }
    @media (max-width: 440px) { .student-filter-grid { grid-template-columns: 1fr; } }
</style>
@endpush

@section('content')
@php
    $sortBy = request('sort_by', 'ho_ten');
    $sortDir = request('sort_dir', 'asc');
    $sortUrl = fn (string $column) => request()->fullUrlWithQuery([
        'sort_by' => $column,
        'sort_dir' => $sortBy === $column && $sortDir === 'asc' ? 'desc' : 'asc',
        'page' => 1,
    ]);
    $sortLabel = fn (string $column) => $sortBy === $column ? ($sortDir === 'asc' ? '↑' : '↓') : '↕';
@endphp

<section class="student-page">
    <div class="student-header">
        <div class="student-heading">
            <h1 class="student-title">Danh sách sinh viên</h1>
            <p class="student-subtitle">Tra cứu sinh viên theo lớp, giới tính, trạng thái và ngày sinh.</p>
        </div>
        <a href="{{ route('sinhvien.create') }}" class="student-add">+ Thêm sinh viên</a>
    </div>

    @if ($errors->any())
        <div class="student-validation" role="alert" aria-live="polite">
            <strong>Vui lòng kiểm tra lại bộ lọc:</strong>
            <ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
        </div>
    @endif

    <section class="student-filter-card" aria-label="Bộ lọc sinh viên">
        <form method="GET" action="{{ route('sinhvien.index') }}">
            <input type="hidden" name="page" value="1">
            <input type="hidden" name="sort_by" value="{{ $sortBy }}">
            <input type="hidden" name="sort_dir" value="{{ $sortDir }}">
            <div class="student-filter-grid">
                <div class="student-field">
                    <label for="student-search">Từ khóa</label>
                    <input id="student-search" type="search" name="search" value="{{ request('search') }}" placeholder="Mã SV, họ tên, email, số điện thoại">
                </div>
                <div class="student-field">
                    <label for="student-class">Lớp học</label>
                    <select id="student-class" name="lop_hoc_id">
                        <option value="">Tất cả lớp</option>
                        @foreach ($lophocs as $lop)
                            <option value="{{ $lop->id }}" {{ (string) request('lop_hoc_id') === (string) $lop->id ? 'selected' : '' }}>{{ $lop->ma_lop }} — {{ $lop->ten_lop }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="student-field">
                    <label for="student-gender">Giới tính</label>
                    <select id="student-gender" name="gioi_tinh">
                        <option value="">Tất cả</option>
                        <option value="1" {{ request('gioi_tinh') === '1' ? 'selected' : '' }}>Nam</option>
                        <option value="0" {{ request('gioi_tinh') === '0' ? 'selected' : '' }}>Nữ</option>
                    </select>
                </div>
                <div class="student-field">
                    <label for="student-status">Trạng thái</label>
                    <select id="student-status" name="trang_thai">
                        <option value="">Tất cả</option>
                        <option value="1" {{ request('trang_thai') === '1' ? 'selected' : '' }}>Đang học</option>
                        <option value="0" {{ request('trang_thai') === '0' ? 'selected' : '' }}>Nghỉ học</option>
                    </select>
                </div>
                <div class="student-field">
                    <label for="birth-from">Ngày sinh từ</label>
                    <input id="birth-from" type="date" name="ngay_sinh_tu" value="{{ request('ngay_sinh_tu') }}">
                    @error('ngay_sinh_tu') <span class="student-field-error">{{ $message }}</span> @enderror
                </div>
                <div class="student-field">
                    <label for="birth-to">Ngày sinh đến</label>
                    <input id="birth-to" type="date" name="ngay_sinh_den" value="{{ request('ngay_sinh_den') }}">
                    @error('ngay_sinh_den') <span class="student-field-error">{{ $message }}</span> @enderror
                </div>
                <div class="student-field">
                    <label for="student-per-page">Số dòng / trang</label>
                    <select id="student-per-page" name="per_page">
                        @foreach ([10, 25, 50] as $size)
                            <option value="{{ $size }}" {{ (int) request('per_page', 10) === $size ? 'selected' : '' }}>{{ $size }} dòng</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="student-filter-actions">
                <button type="submit" class="student-filter-button">Áp dụng bộ lọc</button>
                <a href="{{ route('sinhvien.index') }}" class="student-reset">Xóa bộ lọc</a>
            </div>
        </form>
    </section>

    <section class="student-table-card" aria-label="Kết quả sinh viên">
        <div class="student-table-scroll">
            <table class="student-table">
                <thead>
                    <tr>
                        <th><a class="student-sort-link" href="{{ $sortUrl('ma_sv') }}">Mã SV <span class="student-sort-arrow">{{ $sortLabel('ma_sv') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('ho_ten') }}">Họ và tên <span class="student-sort-arrow">{{ $sortLabel('ho_ten') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('email') }}">Email <span class="student-sort-arrow">{{ $sortLabel('email') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('ngay_sinh') }}">Ngày sinh <span class="student-sort-arrow">{{ $sortLabel('ngay_sinh') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('gioi_tinh') }}">Giới tính <span class="student-sort-arrow">{{ $sortLabel('gioi_tinh') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('lop_hoc') }}">Lớp <span class="student-sort-arrow">{{ $sortLabel('lop_hoc') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('so_dien_thoai') }}">Số điện thoại <span class="student-sort-arrow">{{ $sortLabel('so_dien_thoai') }}</span></a></th>
                        <th><a class="student-sort-link" href="{{ $sortUrl('trang_thai') }}">Trạng thái <span class="student-sort-arrow">{{ $sortLabel('trang_thai') }}</span></a></th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($sinhviens as $sv)
                        <tr>
                            <td><a class="student-code" href="{{ route('sinhvien.show', $sv->id) }}">{{ $sv->ma_sv }}</a></td>
                            <td><a class="student-name" href="{{ route('sinhvien.show', $sv->id) }}">{{ $sv->ho_ten }}</a></td>
                            <td><span class="student-email">{{ $sv->email }}</span></td>
                            <td>{{ $sv->ngay_sinh ? \Carbon\Carbon::parse($sv->ngay_sinh)->format('d/m/Y') : '—' }}</td>
                            <td><span class="student-pill {{ $sv->gioi_tinh ? 'student-male' : 'student-female' }}">{{ $sv->gioi_tinh ? 'Nam' : 'Nữ' }}</span></td>
                            <td>{{ $sv->lopHoc->ten_lop ?? 'Chưa xếp lớp' }}</td>
                            <td>{{ $sv->so_dien_thoai ?: '—' }}</td>
                            <td><span class="student-pill {{ $sv->trang_thai ? 'student-active' : 'student-inactive' }}">{{ $sv->trang_thai ? 'Đang học' : 'Nghỉ học' }}</span></td>
                            <td>
                                <div class="student-row-actions">
                                    <a href="{{ route('sinhvien.show', $sv->id) }}" class="student-edit">Chi tiết</a>
                                    <a href="{{ route('sinhvien.edit', $sv->id) }}" class="student-edit">Sửa</a>
                                    <form action="{{ route('sinhvien.destroy', $sv->id) }}" method="POST" onsubmit="return confirm('Bạn có chắc muốn xóa sinh viên {{ $sv->ho_ten }} không?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="student-delete">Xóa</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td class="student-empty" colspan="9">Không tìm thấy sinh viên phù hợp với bộ lọc.</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <div class="student-result-footer">
        <p class="student-result-summary">
            Hiển thị <strong>{{ $sinhviens->firstItem() ?? 0 }}–{{ $sinhviens->lastItem() ?? 0 }}</strong>
            trong tổng số <strong>{{ $sinhviens->total() }}</strong> sinh viên
        </p>
        <div class="student-pagination">{{ $sinhviens->links('vendor.pagination.app-bootstrap') }}</div>
    </div>
</section>
@endsection
