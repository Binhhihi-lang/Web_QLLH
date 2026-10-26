import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from '@core/auth/auth.interceptor';
import { AuthService } from '@core/auth/auth.service';
import { MockRegistry } from '@core/mock/mock-registry';
import { mockInterceptor } from '@core/mock/mock.interceptor';

describe('Mock authentication integration', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        MockRegistry,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, mockInterceptor])),
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    auth.xoaPhien();
  });

  it('logs in, restores the user from the token, and logs out without a backend', async () => {
    const dangNhap = await firstValueFrom(auth.dangNhap('admin@qllh.test', 'QllhMock2026!', false));
    expect(dangNhap.vai_tro).toBe('ADMIN');
    expect(auth.layToken()).toContain('mock-access-');

    auth.nguoiDung.set(null);
    const nguoiDung = await firstValueFrom(auth.layNguoiDung());
    expect(nguoiDung.vai_tro).toBe('ADMIN');

    await firstValueFrom(auth.dangXuat());
    expect(auth.layToken()).toBeNull();
  });

  it('rejects an incorrect demo password with an unauthorized response', async () => {
    await expect(
      firstValueFrom(auth.dangNhap('admin@qllh.test', 'incorrect', false)),
    ).rejects.toMatchObject({ status: 401 });
  });
});
