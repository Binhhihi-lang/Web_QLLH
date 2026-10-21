<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateTaiKhoanRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Giảng viên (và mọi người dùng) tự quản lý tài khoản của bản thân.
 */
class TaiKhoanController extends Controller
{
    /**
     * Form sửa tài khoản của chính mình.
     */
    public function edit()
    {
        return view('taikhoan.edit', [
            'title' => 'Tài khoản của tôi',
            'nguoiDung' => Auth::user(),
        ]);
    }

    /**
     * Cập nhật tài khoản của chính mình.
     */
    public function update(UpdateTaiKhoanRequest $request)
    {
        $nguoiDung = Auth::user();
        $duLieu = $request->validated();

        // Đổi mật khẩu thì phải nhập đúng mật khẩu hiện tại.
        if (! empty($duLieu['password'])) {
            if (! Hash::check((string) $request->input('mat_khau_hien_tai'), $nguoiDung->password)) {
                return back()->withErrors([
                    'mat_khau_hien_tai' => 'Mật khẩu hiện tại không đúng.',
                ]);
            }
        } else {
            unset($duLieu['password']);
        }

        // Không cho đổi vai trò / trạng thái qua form này.
        unset($duLieu['mat_khau_hien_tai']);

        $nguoiDung->update($duLieu);

        return redirect()->route('taikhoan.edit')
            ->with('success', 'Cập nhật tài khoản thành công!');
    }
}
