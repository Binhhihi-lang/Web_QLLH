{{-- resources/views/nguoidung/_form.blade.php --}}
@php
    /** @var \App\Models\User|null $nguoiDung */
    $nguoiDung = $nguoiDung ?? null;
    $dangSua = $nguoiDung !== null;
    $laChinhMinh = $dangSua && $nguoiDung->id === auth()->id();
@endphp

@if ($errors->any())
    <div class="error-box" role="alert">
        <strong>Vui lòng kiểm tra lại:</strong>
        <ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul>
    </div>
@endif

<div class="form-box">
    <form action="{{ $dangSua ? route('nguoidung.update', $nguoiDung->id) : route('nguoidung.store') }}" method="POST">
        @csrf
        @if ($dangSua)
            @method('PUT')
        @endif

        <div class="form-group">
            <label for="name">Họ tên</label>
            <input type="text" id="name" name="name" value="{{ old('name', $nguoiDung->name ?? '') }}" placeholder="Nguyễn Văn A">
        </div>

        <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="{{ old('email', $nguoiDung->email ?? '') }}" placeholder="nguyenvana@example.com">
        </div>

        <div class="form-group">
            <label for="vai_tro">Vai trò</label>
            <select id="vai_tro" name="vai_tro" @disabled($laChinhMinh)>
                @foreach ($vaiTroOptions as $key => $label)
                    <option value="{{ $key }}" {{ old('vai_tro', $nguoiDung->vai_tro ?? 'giang_vien') === $key ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>
            @if ($laChinhMinh)
                <small class="field-hint">Bạn không thể tự đổi vai trò của chính mình.</small>
                <input type="hidden" name="vai_tro" value="{{ $nguoiDung->vai_tro }}">
            @endif
        </div>

        <div class="form-group">
            <label for="password">{{ $dangSua ? 'Mật khẩu mới' : 'Mật khẩu' }}</label>
            <input type="password" id="password" name="password" placeholder="••••••••">
            @if ($dangSua)
                <small class="field-hint">Để trống nếu không muốn đổi mật khẩu.</small>
            @else
                <small class="field-hint">Tối thiểu 6 ký tự.</small>
            @endif
        </div>

        <div class="form-group">
            <label for="password_confirmation">Xác nhận mật khẩu</label>
            <input type="password" id="password_confirmation" name="password_confirmation" placeholder="••••••••">
        </div>

        <div class="form-check">
            <input type="checkbox" id="trang_thai" name="trang_thai" value="1"
                   {{ old('trang_thai', $nguoiDung->trang_thai ?? true) ? 'checked' : '' }}
                   @disabled($laChinhMinh)>
            <label for="trang_thai">Đang hoạt động</label>
        </div>
        @if ($laChinhMinh)
            <input type="hidden" name="trang_thai" value="1">
        @endif

        <div class="form-actions">
            <button type="submit" class="btn-submit">{{ $dangSua ? 'Cập nhật' : 'Lưu người dùng' }}</button>
            <a href="{{ route('nguoidung.index') }}" class="btn-cancel">Hủy</a>
        </div>
    </form>
</div>
