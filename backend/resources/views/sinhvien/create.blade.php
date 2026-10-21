{{-- resources/views/sinhvien/create.blade.php --}}
@extends('layouts.layoutmaster')

@push('styles')
<style>
    .form-box{
        max-width: 520px;
        background: var(--paper-2);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 28px;
    }
    .form-group{ margin-bottom: 18px; }
    .form-group label{
        display:block;
        font-size:13px;
        font-weight:600;
        margin-bottom:6px;
        color: var(--ink);
    }
    .form-group input,
    .form-group textarea,
    .form-group select{
        width:100%;
        padding:10px 12px;
        border:1px solid var(--line);
        border-radius:8px;
        font-size:13.5px;
        font-family:'Inter', sans-serif;
        outline:none;
        transition:border-color .15s ease;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus{ border-color:var(--gold); }
    .form-group textarea{ resize:vertical; min-height:80px; }

    .form-row{
        display:flex;
        gap:16px;
    }
    .form-row .form-group{ flex:1; }

    .form-check{
        display:flex;
        align-items:center;
        gap:8px;
        margin-bottom:22px;
    }
    .form-check input{ width:auto; }
    .form-check label{ margin:0; font-weight:500; }

    .form-actions{ display:flex; gap:10px; }
    .btn-submit{
        background: var(--navy);
        color:#F5F1E8;
        border:none;
        padding:10px 22px;
        border-radius:8px;
        font-size:13.5px;
        font-weight:600;
        cursor:pointer;
        transition:background .15s ease;
    }
    .btn-submit:hover{ background: var(--navy-2); }
    .btn-cancel{
        display:inline-flex;
        align-items:center;
        padding:10px 22px;
        border-radius:8px;
        font-size:13.5px;
        font-weight:600;
        color:var(--ink);
        background:#fff;
        border:1px solid var(--line);
        text-decoration:none;
        transition:border-color .15s ease;
    }
    .btn-cancel:hover{ border-color:var(--gold); }

    .error-box{
        background:#FBEAEA;
        border:1px solid #E8B4B4;
        color:#A33;
        padding:12px 14px;
        border-radius:8px;
        font-size:13px;
        margin-bottom:18px;
    }
    .error-box ul{ margin-left:18px; margin-top:4px; }
</style>
@endpush

@section('content')
    <div class="page-title">Thêm sinh viên</div>
    <div class="page-sub">Nhập thông tin sinh viên mới vào hệ thống.</div>

    <div class="form-box">
        <form action="{{ route('sinhvien.store') }}" method="POST">
            @csrf

            <div class="form-row">
                <div class="form-group">
                    <label for="ma_sv">Mã sinh viên</label>
                    <input type="text" id="ma_sv" name="ma_sv" value="{{ old('ma_sv') }}" placeholder="SV001">
                </div>
                
                <div class="form-group">
                    <label for="ho_ten">Họ và tên</label>
                    <input type="text" id="ho_ten" name="ho_ten" value="{{ old('ho_ten') }}" placeholder="Nguyễn Văn A">
                </div>
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="{{ old('email') }}" placeholder="sinhvien@example.com">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="ngay_sinh">Ngày sinh</label>
                    <input type="date" id="ngay_sinh" name="ngay_sinh" value="{{ old('ngay_sinh') }}">
                </div>
                <div class="form-group">
                    <label for="gioi_tinh">Giới tính</label>
                    <select id="gioi_tinh" name="gioi_tinh">
                        <option value="1" {{ old('gioi_tinh', '1') == '1' ? 'selected' : '' }}>Nam</option>
                        <option value="0" {{ old('gioi_tinh') == '0' ? 'selected' : '' }}>Nữ</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="lop_hoc_id">Lớp học</label>
                <select id="lop_hoc_id" name="lop_hoc_id">
                    <option value="">— Chưa xếp lớp —</option>
                    @foreach ($lophocs as $lop)
                        <option value="{{ $lop->id }}" {{ old('lop_hoc_id') == $lop->id ? 'selected' : '' }}>
                            {{ $lop->ma_lop }} — {{ $lop->ten_lop }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="form-group">
                <label for="so_dien_thoai">Số điện thoại</label>
                <input type="text" id="so_dien_thoai" name="so_dien_thoai" value="{{ old('so_dien_thoai') }}" placeholder="0901234567">
            </div>

            <div class="form-group">
                <label for="dia_chi">Địa chỉ</label>
                <textarea id="dia_chi" name="dia_chi" placeholder="Địa chỉ (không bắt buộc)">{{ old('dia_chi') }}</textarea>
            </div>

            <div class="form-check">
                <input type="checkbox" id="trang_thai" name="trang_thai" value="1" {{ old('trang_thai', true) ? 'checked' : '' }}>
                <label for="trang_thai">Đang học</label>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-submit">Lưu sinh viên</button>
                <a href="{{ route('sinhvien.index') }}" class="btn-cancel">Hủy</a>
            </div>
        </form>
    </div>
@endsection
