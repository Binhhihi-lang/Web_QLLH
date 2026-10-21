@extends('layouts.layoutmaster')

@push('styles')
<style>
    .student-detail-page { max-width: 900px; margin: 0 auto; }
    .detail-heading { margin-bottom: 1.25rem; }
    .detail-title { color: var(--navy); font-size: 1.7rem; margin: 0 0 .3rem; }
    .detail-subtitle { color: var(--ink-muted); font-size: .9rem; margin: 0; }
    .detail-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
    .detail-card-title { background: #f7f8fa; border-bottom: 1px solid var(--line); color: var(--navy); font-size: 1rem; font-weight: 700; margin: 0; padding: 1rem 1.2rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .detail-item { border-bottom: 1px solid #edf0f3; padding: 1rem 1.2rem; min-width: 0; }
    .detail-item:nth-child(odd) { border-right: 1px solid #edf0f3; }
    .detail-label { color: var(--ink-muted); display: block; font-size: .76rem; font-weight: 600; margin-bottom: .35rem; }
    .detail-value { color: var(--ink); font-size: .92rem; overflow-wrap: anywhere; }
    .detail-pill { border-radius: 999px; display: inline-flex; font-size: .76rem; font-weight: 600; padding: .28rem .65rem; }
    .detail-active { background: #e7f5ec; color: #216d3a; }
    .detail-inactive { background: #fcebea; color: #963b36; }
    .detail-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1rem; }
    .detail-link { align-items: center; background: #fff; border: 1px solid #d8dce3; border-radius: 7px; color: var(--ink); display: inline-flex; font-size: .875rem; font-weight: 600; min-height: 40px; padding: .55rem .9rem; text-decoration: none; }
    .detail-link:hover { background: var(--paper-2); color: var(--ink); }
    .detail-link-primary { background: var(--navy); border-color: var(--navy); color: #fff; }
    .detail-link-primary:hover { background: var(--navy-2); border-color: var(--navy-2); color: #fff; }
    @media (max-width: 600px) {
        .detail-grid { grid-template-columns: 1fr; }
        .detail-item:nth-child(odd) { border-right: 0; }
    }
</style>
@endpush

@section('content')
<section class="student-detail-page">
    <div class="detail-heading">
        <h1 class="detail-title">Chi tiết sinh viên</h1>
        <p class="detail-subtitle">Thông tin hồ sơ của {{ $sinhvien->ho_ten }}.</p>
    </div>

    <div class="detail-card">
        <h2 class="detail-card-title">Thông tin cá nhân</h2>
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Mã sinh viên</span><span class="detail-value">{{ $sinhvien->ma_sv }}</span></div>
            <div class="detail-item"><span class="detail-label">Họ và tên</span><span class="detail-value">{{ $sinhvien->ho_ten }}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">{{ $sinhvien->email }}</span></div>
            <div class="detail-item"><span class="detail-label">Ngày sinh</span><span class="detail-value">{{ $sinhvien->ngay_sinh ? \Carbon\Carbon::parse($sinhvien->ngay_sinh)->format('d/m/Y') : 'Chưa cập nhật' }}</span></div>
            <div class="detail-item"><span class="detail-label">Giới tính</span><span class="detail-value">{{ $sinhvien->gioi_tinh ? 'Nam' : 'Nữ' }}</span></div>
            <div class="detail-item"><span class="detail-label">Lớp học</span><span class="detail-value">{{ $sinhvien->lopHoc ? $sinhvien->lopHoc->ma_lop . ' — ' . $sinhvien->lopHoc->ten_lop : 'Chưa xếp lớp' }}</span></div>
            <div class="detail-item"><span class="detail-label">Số điện thoại</span><span class="detail-value">{{ $sinhvien->so_dien_thoai ?: 'Chưa cập nhật' }}</span></div>
            <div class="detail-item"><span class="detail-label">Địa chỉ</span><span class="detail-value">{{ $sinhvien->dia_chi ?: 'Chưa cập nhật' }}</span></div>
            <div class="detail-item"><span class="detail-label">Trạng thái</span><span class="detail-value"><span class="detail-pill {{ $sinhvien->trang_thai ? 'detail-active' : 'detail-inactive' }}">{{ $sinhvien->trang_thai ? 'Đang học' : 'Nghỉ học' }}</span></span></div>
        </div>
    </div>

    <div class="detail-actions">
        <a href="{{ route('sinhvien.index') }}" class="detail-link">Quay lại danh sách</a>
        <a href="{{ route('sinhvien.edit', $sinhvien->id) }}" class="detail-link detail-link-primary">Sửa thông tin</a>
    </div>
</section>
@endsection
