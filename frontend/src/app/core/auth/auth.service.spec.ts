import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const nguoiDung = {
    id: 1,
    name: 'Quản trị viên',
    email: 'admin@example.com',
    avatar_url: null,
    vai_tro: 'ADMIN' as const,
    trang_thai: true,
    must_change_password: false,
    ho_so: null,
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores a remembered login persistently and updates the current user', async () => {
    const result = firstValueFrom(service.dangNhap('admin@example.com', 'secret', true));
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@example.com', password: 'secret' });
    request.flush({
      success: true,
      message: 'Đăng nhập thành công.',
      data: { token: '1|access-token', het_han_luc: '2026-10-27 10:00:00', nguoi_dung: nguoiDung },
    });

    await expect(result).resolves.toEqual(nguoiDung);
    expect(localStorage.getItem('qllh_access_token')).toBe('1|access-token');
    expect(sessionStorage.getItem('qllh_access_token')).toBeNull();
    expect(service.nguoiDung()).toEqual(nguoiDung);
  });

  it('keeps a non-remembered login in the current browser session only', async () => {
    localStorage.setItem('qllh_access_token', 'old-token');

    const result = firstValueFrom(service.dangNhap('admin@example.com', 'secret', false));
    http.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({
      success: true,
      message: 'Đăng nhập thành công.',
      data: { token: '2|session-token', het_han_luc: '2026-10-27 10:00:00', nguoi_dung: nguoiDung },
    });

    await expect(result).resolves.toEqual(nguoiDung);
    expect(sessionStorage.getItem('qllh_access_token')).toBe('2|session-token');
    expect(localStorage.getItem('qllh_access_token')).toBeNull();
  });

  it('submits a student number as the student login identifier', async () => {
    const result = firstValueFrom(service.dangNhap('SV000123', 'secret', false, 'ma_sv'));
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.body).toEqual({ ma_sv: 'SV000123', password: 'secret' });
    request.flush({
      success: true,
      message: 'Đăng nhập thành công.',
      data: { token: '3|student-token', het_han_luc: '2026-10-27 10:00:00', nguoi_dung: nguoiDung },
    });

    await expect(result).resolves.toEqual(nguoiDung);
  });

  it('updates the login state when a session is created and cleared', async () => {
    expect(service.daDangNhap()).toBe(false);

    const result = firstValueFrom(service.dangNhap('admin@example.com', 'secret', false));
    http.expectOne(`${environment.apiBaseUrl}/auth/login`).flush({
      success: true,
      message: 'Đăng nhập thành công.',
      data: { token: '2|session-token', het_han_luc: '2026-10-27 10:00:00', nguoi_dung: nguoiDung },
    });
    await result;
    expect(service.daDangNhap()).toBe(true);

    service.xoaPhien();
    expect(service.daDangNhap()).toBe(false);
  });

  it('loads the current user using the saved bearer token', async () => {
    sessionStorage.setItem('qllh_access_token', '2|session-token');

    const result = firstValueFrom(service.layNguoiDung());
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer 2|session-token');
    request.flush({ success: true, message: 'Thành công.', data: nguoiDung });

    await expect(result).resolves.toEqual(nguoiDung);
    expect(service.nguoiDung()).toEqual(nguoiDung);
  });

  it('changes the password and clears the forced-change flag', async () => {
    service.nguoiDung.set({ ...nguoiDung, must_change_password: true });

    const result = firstValueFrom(
      service.doiMatKhau('old-password', 'new-password', 'new-password'),
    );
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/change-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      mat_khau_cu: 'old-password',
      password: 'new-password',
      password_confirmation: 'new-password',
    });
    request.flush({ success: true, message: 'Đã đổi mật khẩu.', data: null });

    await expect(result).resolves.toBeUndefined();
    expect(service.nguoiDung()?.must_change_password).toBe(false);
  });

  it('clears the local session after logout succeeds', async () => {
    sessionStorage.setItem('qllh_access_token', '2|session-token');

    const result = firstValueFrom(service.dangXuat());
    http.expectOne(`${environment.apiBaseUrl}/auth/logout`).flush({
      success: true,
      message: 'Đăng xuất thành công.',
      data: null,
    });

    await expect(result).resolves.toBeUndefined();
    expect(sessionStorage.getItem('qllh_access_token')).toBeNull();
    expect(service.nguoiDung()).toBeNull();
  });
});
