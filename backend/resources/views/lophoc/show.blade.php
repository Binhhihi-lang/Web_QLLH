@extends('layouts.layoutmaster')

@push('styles')
<style>
    .show-box {
        max-width: 600px;
        background: var(--paper-2);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 28px;
    }
    .detail-row {
        display: flex;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
    }
    .detail-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    .detail-label {
        font-weight: 600;
        width: 140px;
        color: var(--ink);
    }
    .detail-value {
        color: var(--ink-muted);
        flex: 1;
    }
    .btn-back {
        display: inline-flex;
        align-items: center;
        margin-top: 20px;
        padding: 10px 22px;
        border-radius: 8px;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ink);
        background: #fff;
        border: 1px solid var(--line);
        text-decoration: none;
        transition: border-color .15s ease;
    }
    .btn-back:hover { border-color: var(--gold); }
</style>
@endpush

@section('content')
    <div class="page-title">Chi tiết lớp học</div>
    <div class="page-sub">Thông tin chi tiết về lớp học: {{ $lophoc->ten_lop }}</div>

    <div class="show-box">
        <div class="detail-row">
            <div class="detail-label">ID</div>
            <div class="detail-value">{{ $lophoc->id }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Tên lớp</div>
            <div class="detail-value">{{ $lophoc->ten_lop }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Mã lớp</div>
            <div class="detail-value">{{ $lophoc->ma_lop }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Giáo viên</div>
            <div class="detail-value">{{ $lophoc->giao_vien }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Số điện thoại GVCN</div>
            <div class="detail-value">{{ $lophoc->so_dien_thoai_gvcn ?: '—' }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Sĩ số</div>
            <div class="detail-value">{{ $lophoc->si_so }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Ghi chú</div>
            <div class="detail-value">{{ $lophoc->ghi_chu ?: '—' }}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Trạng thái</div>
            <div class="detail-value">
                @if ($lophoc->trang_thai)
                    <span style="color:#1E7B3C; font-weight:600;">Đang hoạt động</span>
                @else
                    <span style="color:#A33; font-weight:600;">Ngừng hoạt động</span>
                @endif
            </div>
        </div>
    </div>

    <a href="{{ route('lophoc.index') }}" class="btn-back">Quay lại danh sách</a>
@endsection
