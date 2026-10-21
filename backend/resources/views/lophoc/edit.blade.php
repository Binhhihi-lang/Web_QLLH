{{-- resources/views/lophoc/edit.blade.php --}}
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
    .form-group textarea{
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
    .form-group textarea:focus{ border-color:var(--gold); }
    .form-group textarea{ resize:vertical; min-height:80px; }

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
    <div class="page-title">Sửa lớp học</div>
    <div class="page-sub">Cập nhật thông tin lớp học «{{ $lophoc->ten_lop }}».</div>

    <div class="form-box">
        {{-- Trỏ tới route update, kèm id của lớp học đang sửa --}}
        <form action="{{ route('lophoc.update', $lophoc->id) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="form-group">
                <label for="ten_lop">Tên lớp</label>
                <input type="text" id="ten_lop" name="ten_lop"
                       value="{{ old('ten_lop', $lophoc->ten_lop) }}">
            </div>

            <div class="form-group">
                <label for="ma_lop">Mã lớp</label>
                <input type="text" id="ma_lop" name="ma_lop"
                       value="{{ old('ma_lop', $lophoc->ma_lop) }}">
            </div>

            <div class="form-group">
                <label for="giao_vien">Giáo viên</label>
                <input type="text" id="giao_vien" name="giao_vien"
                       value="{{ old('giao_vien', $lophoc->giao_vien) }}">
            </div>

            <div class="form-group">
                <label for="so_dien_thoai_gvcn">Số điện thoại GVCN</label>
                <input type="text" id="so_dien_thoai_gvcn" name="so_dien_thoai_gvcn"
                       value="{{ old('so_dien_thoai_gvcn', $lophoc->so_dien_thoai_gvcn) }}">
            </div>

            <div class="form-group">
                <label for="si_so">Sĩ số</label>
                <input type="number" id="si_so" name="si_so"
                       value="{{ old('si_so', $lophoc->si_so) }}">
            </div>

            <div class="form-group">
                <label for="ghi_chu">Ghi chú</label>
                <textarea id="ghi_chu" name="ghi_chu">{{ old('ghi_chu', $lophoc->ghi_chu) }}</textarea>
            </div>

            <div class="form-check">
                <input type="checkbox" id="trang_thai" name="trang_thai" value="1"
                       {{ old('trang_thai', $lophoc->trang_thai) ? 'checked' : '' }}>
                <label for="trang_thai">Đang hoạt động</label>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-submit">Cập nhật</button>
                <a href="{{ route('lophoc.index') }}" class="btn-cancel">Hủy</a>
            </div>
        </form>
    </div>
@endsection
