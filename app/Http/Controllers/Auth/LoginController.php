<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Hiển thị form đăng nhập.
     */
    public function hienThiForm()
    {
        if (Auth::check()) {
            return redirect()->route('lophoc.index');
        }

        return view('auth.login', [
            'title' => 'Đăng nhập',
        ]);
    }

    /**
     * Xử lý đăng nhập.
     */
    public function dangNhap(LoginRequest $request)
    {
        $thongTin = $request->validated();

        if (! Auth::attempt($thongTin)) {
            // Không nói rõ sai email hay sai mật khẩu để tránh dò tài khoản.
            throw ValidationException::withMessages([
                'email' => 'Email hoặc mật khẩu không đúng.',
            ]);
        }

        // Tài khoản bị khóa thì đăng xuất ngay.
        /** @var User $nguoiDung */
        $nguoiDung = Auth::user();
        if (! $nguoiDung->trang_thai) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Tài khoản của bạn đã bị khóa.',
            ]);
        }

        // Chống tấn công cố định session.
        $request->session()->regenerate();

        return redirect()->intended(route('lophoc.index'))
            ->with('success', 'Đăng nhập thành công. Xin chào ' . $nguoiDung->name . '!');
    }

    /**
     * Đăng xuất.
     */
    public function dangXuat(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Bạn đã đăng xuất.');
    }
}
