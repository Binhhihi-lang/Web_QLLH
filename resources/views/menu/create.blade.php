{{-- resources/views/menu/create.blade.php --}}
@extends('layouts.layoutmaster')

@push('styles')
<style>
    .form-box{ max-width: 520px; background: var(--paper-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 28px; }
    .form-group{ margin-bottom: 18px; }
    .form-group label{ display:block; font-size:13px; font-weight:600; margin-bottom:6px; color: var(--ink); }
    .form-group input, .form-group select{
        width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px;
        font-size:13.5px; font-family:'Inter', sans-serif; outline:none; transition:border-color .15s ease;
    }
    .form-group input:focus, .form-group select:focus{ border-color:var(--gold); }
    .form-hint{ font-size:11.5px; color:var(--ink-muted); margin-top:4px; }
    .form-check{ display:flex; align-items:center; gap:8px; margin-bottom:22px; }
    .form-check input{ width:auto; }
    .form-check label{ margin:0; font-weight:500; }
    .form-actions{ display:flex; gap:10px; }
    .btn-submit{ background: var(--navy); color:#F5F1E8; border:none; padding:10px 22px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; transition:background .15s ease; }
    .btn-submit:hover{ background: var(--navy-2); }
    .btn-cancel{ display:inline-flex; align-items:center; padding:10px 22px; border-radius:8px; font-size:13.5px; font-weight:600; color:var(--ink); background:#fff; border:1px solid var(--line); text-decoration:none; transition:border-color .15s ease; }
    .btn-cancel:hover{ border-color:var(--gold); }
</style>
@endpush

@section('content')
    <div class="page-title">Thêm Menu</div>
    <div class="page-sub">Tạo mục menu mới trong hệ thống.</div>

    <div class="form-box">
        <form action="{{ route('menu.store') }}" method="POST">
            @csrf

            <div class="form-group">
                <label for="ten">Tên menu</label>
                <input type="text" id="ten" name="ten"
                       value="{{ old('ten') }}" placeholder="Ví dụ: Quản lý sinh viên">
            </div>

            <div class="form-group">
                <label for="url">Đường dẫn</label>
                <input type="text" id="url" name="url"
                       value="{{ old('url') }}" placeholder="/sinhvien">
                <p class="form-hint">Bắt đầu bằng /, # hoặc http(s)://</p>
            </div>

            <div class="form-group">
                <label for="vi_tri">Vị trí</label>
                <select id="vi_tri" name="vi_tri">
                    @foreach ($viTriOptions as $key => $label)
                        <option value="{{ $key }}" {{ old('vi_tri', 'sidebar') === $key ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <div class="form-group">
                <label for="nhom">Nhóm</label>
                <input type="text" id="nhom" name="nhom"
                       value="{{ old('nhom') }}" placeholder="Ví dụ: Học vụ">
                <p class="form-hint">Không bắt buộc.</p>
            </div>

            <div class="form-group">
                <label for="vai_tro">Chỉ hiển thị với vai trò</label>
                <select id="vai_tro" name="vai_tro">
                    <option value="" {{ old('vai_tro') === null ? 'selected' : '' }}>Mọi vai trò</option>
                    @foreach ($vaiTroOptions as $key => $label)
                        <option value="{{ $key }}" {{ old('vai_tro') === $key ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
                <p class="form-hint">Chọn «Mọi vai trò» nếu ai cũng thấy mục này.</p>
            </div>

            <div class="form-group">
                <label for="thu_tu">Thứ tự</label>
                <input type="number" id="thu_tu" name="thu_tu"
                       value="{{ old('thu_tu', 0) }}">
            </div>

            <div class="form-check">
                <input type="checkbox" id="trang_thai" name="trang_thai" value="1"
                       {{ old('trang_thai', true) ? 'checked' : '' }}>
                <label for="trang_thai">Đang hiển thị</label>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-submit">Lưu menu</button>
                <a href="{{ route('menu.index') }}" class="btn-cancel">Hủy</a>
            </div>
        </form>
    </div>
@endsection