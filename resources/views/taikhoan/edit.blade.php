@extends('layouts.layoutmaster')

@push('styles')
<style>
    .form-box{ max-width:520px; background:var(--paper-2); border:1px solid var(--line); border-radius:var(--radius); padding:28px; }
    .form-group{ margin-bottom:18px; }
    .form-group label{ display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:var(--ink); }
    .form-group input{
        width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px;
        font-size:13.5px; font-family:'Inter', sans-serif; outline:none; transition:border-color .15s ease;
    }
    .form-group input:focus{ border-color:var(--gold); }
    .field-hint{ display:block; margin-top:5px; font-size:11.5px; color:var(--ink-muted); }
    .section-title{ font-family:'Fraunces', serif; font-size:15px; font-weight:700; color:var(--navy); margin:26px 0 14px; padding-top:18px; border-top:1px solid var(--line); }
    .role-note{ background:#fff; border:1px solid var(--line); border-radius:8px; padding:12px 14px; font-size:12.5px; color:var(--ink-muted); margin-bottom:18px; }
    .form-actions{ display:flex; gap:10px; }
    .btn-submit{ background:var(--navy); color:#F5F1E8; border:none; padding:10px 22px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; transition:background .15s ease; }
    .btn-submit:hover{ background:var(--navy-2); }
    .error-box{ background:#FBEAEA; border:1px solid #E8B4B4; color:#A33; padding:12px 14px; border-radius:8px; font-size:13px; margin-bottom:18px; }
    .error-box ul{ margin-left:18px; margin-top:4px; }
</style>
@endpush

@section('content')
    <div class="page-title">Tài khoản của tôi</div>
    <div class="page-sub">Cập nhật thông tin đăng nhập và mật khẩu của bạn.</div>

    @if ($errors->any())
        <div class="error-box" role="alert">
            <strong>Vui lòng kiểm tra lại:</strong>
            <ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
        </div>
    @endif

    <div class="form-box">
        <div class="role-note">
            Vai trò hiện tại: <strong>{{ $nguoiDung->tenVaiTro() }}</strong>
            @if ($nguoiDung->laGiangVien())
                — bạn được quản lý lớp học, sinh viên và tài khoản của bản thân.
            @else
                — bạn có toàn quyền trên hệ thống.
            @endif
        </div>

        <form action="{{ route('taikhoan.update') }}" method="POST">
            @csrf
            @method('PUT')

            <div class="form-group">
                <label for="name">Họ tên</label>
                <input type="text" id="name" name="name" value="{{ old('name', $nguoiDung->name) }}">
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="{{ old('email', $nguoiDung->email) }}">
            </div>

            <div class="section-title">Đổi mật khẩu</div>

            <div class="form-group">
                <label for="mat_khau_hien_tai">Mật khẩu hiện tại</label>
                <input type="password" id="mat_khau_hien_tai" name="mat_khau_hien_tai" placeholder="••••••••">
                <small class="field-hint">Chỉ cần nhập khi bạn muốn đổi mật khẩu.</small>
            </div>

            <div class="form-group">
                <label for="password">Mật khẩu mới</label>
                <input type="password" id="password" name="password" placeholder="••••••••">
            </div>

            <div class="form-group">
                <label for="password_confirmation">Xác nhận mật khẩu mới</label>
                <input type="password" id="password_confirmation" name="password_confirmation" placeholder="••••••••">
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-submit">Cập nhật tài khoản</button>
            </div>
        </form>
    </div>
@endsection
