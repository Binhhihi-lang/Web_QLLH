{{-- resources/views/auth/login.blade.php --}}
@extends('layouts.authmaster')

@push('styles')
<style>
    .login-card{
        width:100%; max-width:420px;
        background: var(--paper);
        border-radius:14px;
        padding:36px 34px;
        box-shadow:0 24px 60px rgb(0 0 0 / 35%);
    }
    .brand{ display:flex; align-items:center; gap:12px; margin-bottom:26px; }
    .brand-mark{
        width:42px; height:42px; border-radius:50%;
        background: var(--gold); color: var(--navy);
        display:flex; align-items:center; justify-content:center;
        font-family:'Fraunces', serif; font-weight:700; font-size:17px;
    }
    .brand-title{ font-family:'Fraunces', serif; font-weight:700; font-size:19px; color:var(--navy); }
    .brand-sub{ font-size:11px; color:var(--ink-muted); letter-spacing:.06em; text-transform:uppercase; }

    .form-group{ margin-bottom:18px; }
    .form-group label{ display:block; font-size:13px; font-weight:600; margin-bottom:6px; }
    .form-group input{
        width:100%; padding:11px 13px;
        border:1px solid var(--line); border-radius:8px;
        font-size:13.5px; font-family:'Inter', sans-serif;
        outline:none; transition:border-color .15s ease;
    }
    .form-group input:focus{ border-color:var(--gold); box-shadow:0 0 0 3px rgb(201 162 39 / 15%); }

    .btn-login{
        width:100%; background:var(--navy); color:#F5F1E8;
        border:none; padding:12px; border-radius:8px;
        font-size:14px; font-weight:600; cursor:pointer;
        font-family:'Inter', sans-serif; transition:background .15s ease;
    }
    .btn-login:hover{ background:var(--navy-2); }

    .error-box{
        background:#FBEAEA; border:1px solid #E8B4B4; color:#A33;
        padding:11px 13px; border-radius:8px; font-size:12.5px; margin-bottom:18px;
    }

    .hint-box{
        margin-top:22px; padding-top:18px; border-top:1px solid var(--line);
        font-size:11.5px; color:var(--ink-muted); line-height:1.7;
    }
    .hint-box code{
        font-family:'JetBrains Mono', monospace; font-size:11px;
        background:#fff; border:1px solid var(--line);
        border-radius:4px; padding:1px 5px; color:var(--navy);
    }
</style>
@endpush

@section('content')
    <div class="login-card">
        <div class="brand">
            <div class="brand-mark">QL</div>
            <div>
                <div class="brand-title">Quản lý Sinh viên</div>
                <div class="brand-sub">Hệ thống học vụ</div>
            </div>
        </div>

        @if ($errors->any())
            <div class="error-box" role="alert">
                @foreach ($errors->all() as $error)
                    <div>{{ $error }}</div>
                @endforeach
            </div>
        @endif

        <form action="{{ route('login.attempt') }}" method="POST">
            @csrf

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email"
                       value="{{ old('email') }}" autofocus
                       placeholder="admin@example.com" required>
            </div>

            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" name="password"
                       placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn-login">Đăng nhập</button>
        </form>

        <div class="hint-box">
            Tài khoản mẫu sau khi chạy seeder:<br>
            Admin: <code>admin@example.com</code> / <code>password</code><br>
            Giảng viên: <code>giangvien@example.com</code> / <code>password</code>
        </div>
    </div>
@endsection
