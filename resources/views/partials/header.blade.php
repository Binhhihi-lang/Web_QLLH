{{-- resources/views/partials/header.blade.php --}}
@push('styles')
<style>
    header{
        grid-area:header;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 26px;
        background:var(--navy);
        border-bottom:2px solid var(--gold);
    }
    .brand{ display:flex; align-items:center; gap:12px; color:#F5F1E8; }
    .brand-mark{
        width:34px; height:34px; border-radius:50%;
        background:var(--gold);
        display:flex; align-items:center; justify-content:center;
        font-family:'Fraunces', serif; font-weight:700; font-size:15px; color:var(--navy);
    }
    .brand-text .title{ font-family:'Fraunces', serif; font-weight:700; font-size:17px; letter-spacing:.01em; }
    .brand-text .sub{ font-size:11px; color:#9FA8C9; letter-spacing:.06em; text-transform:uppercase; }

    .header-nav{ display:flex; align-items:center; gap:4px; flex:1; margin:0 32px; }
    .header-nav a{
        padding:7px 13px; border-radius:7px; text-decoration:none;
        color:#B9C0DC; font-size:13px; font-weight:500;
        transition:background .15s ease, color .15s ease;
    }
    .header-nav a:hover{ background:var(--navy-2); color:#F5F1E8; }
    .header-nav a.active{ background:var(--gold-dim); color:var(--gold); }

    .header-user{ display:flex; align-items:center; gap:10px; padding-left:20px; border-left:1px solid var(--navy-border); }
    .avatar{
        width:34px; height:34px; border-radius:50%; background:var(--navy-2); border:1px solid var(--gold);
        display:flex; align-items:center; justify-content:center;
        font-family:'Fraunces', serif; font-size:13px; font-weight:700; color:var(--gold);
        flex-shrink:0;
    }
    .header-user .name{ font-size:13px; font-weight:600; color:#F5F1E8; }
    .header-user .role{ font-size:11px; color:#9FA8C9; }
    .user-link{ text-decoration:none; }
    .user-link:hover .name{ color:var(--gold); }
    .logout-button{
        background:transparent; border:1px solid var(--navy-border); color:#B9C0DC;
        border-radius:7px; cursor:pointer; font:inherit; font-size:12px;
        padding:6px 11px; transition:border-color .15s ease, color .15s ease;
    }
    .logout-button:hover{ border-color:var(--gold); color:var(--gold); }

    @media (max-width: 860px){
        .header-nav{ display:none; }
        .header-user .name, .header-user .role{ display:none; }
    }
</style>
@endpush

@php
    $nguoiDung = auth()->user();
    // Menu header lấy từ bảng menus theo vai trò đang đăng nhập.
    $menuHeader = \App\Models\Menu::query()
        ->hienThiCho($nguoiDung?->vai_tro)
        ->where('vi_tri', 'header')
        ->get();
@endphp

<header>
    <div class="brand">
        <div class="brand-mark">QL</div>
        <div class="brand-text">
            <div class="title">Quản lý Sinh viên</div>
            <div class="sub">Hệ thống học vụ</div>
        </div>
    </div>

    <nav class="header-nav">
        @foreach ($menuHeader as $menu)
            <a href="{{ $menu->url }}" class="{{ $menu->dangChon() ? 'active' : '' }}">{{ $menu->ten }}</a>
        @endforeach
    </nav>

    @if ($nguoiDung)
        <div class="header-user">
            <div class="avatar">{{ mb_strtoupper(mb_substr($nguoiDung->name, 0, 2)) }}</div>
            <a href="{{ route('taikhoan.edit') }}" class="user-link">
                <div class="name">{{ $nguoiDung->name }}</div>
                <div class="role">{{ $nguoiDung->tenVaiTro() }}</div>
            </a>
            <form action="{{ route('logout') }}" method="POST">
                @csrf
                <button type="submit" class="logout-button">Đăng xuất</button>
            </form>
        </div>
    @endif
</header>
