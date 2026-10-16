@extends('layouts.layoutmaster')

@push('styles')
<style>
    .form-box{ max-width:520px; background:var(--paper-2); border:1px solid var(--line); border-radius:var(--radius); padding:28px; }
    .form-group{ margin-bottom:18px; }
    .form-group label{ display:block; font-size:13px; font-weight:600; margin-bottom:6px; color:var(--ink); }
    .form-group input, .form-group select{
        width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:8px;
        font-size:13.5px; font-family:'Inter', sans-serif; outline:none; transition:border-color .15s ease;
    }
    .form-group input:focus, .form-group select:focus{ border-color:var(--gold); }
    .form-group input:disabled, .form-group select:disabled{ background:#F1EFE8; color:var(--ink-muted); cursor:not-allowed; }
    .field-hint{ display:block; margin-top:5px; font-size:11.5px; color:var(--ink-muted); }
    .form-check{ display:flex; align-items:center; gap:8px; margin-bottom:22px; }
    .form-check input{ width:auto; }
    .form-check label{ margin:0; font-weight:500; }
    .form-actions{ display:flex; gap:10px; }
    .btn-submit{ background:var(--navy); color:#F5F1E8; border:none; padding:10px 22px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; transition:background .15s ease; }
    .btn-submit:hover{ background:var(--navy-2); }
    .btn-cancel{ display:inline-flex; align-items:center; padding:10px 22px; border-radius:8px; font-size:13.5px; font-weight:600; color:var(--ink); background:#fff; border:1px solid var(--line); text-decoration:none; transition:border-color .15s ease; }
    .btn-cancel:hover{ border-color:var(--gold); }
    .error-box{ background:#FBEAEA; border:1px solid #E8B4B4; color:#A33; padding:12px 14px; border-radius:8px; font-size:13px; margin-bottom:18px; }
    .error-box ul{ margin-left:18px; margin-top:4px; }
</style>
@endpush

@section('content')
    <div class="page-title">Thêm người dùng</div>
    <div class="page-sub">Tạo tài khoản quản trị viên hoặc giảng viên mới.</div>

    @include('nguoidung._form', ['nguoiDung' => null])
@endsection
