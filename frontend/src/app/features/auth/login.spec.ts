import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { NguoiDung } from '@core/models/dao-tao.model';
import { environment } from '@env/environment';
import { LoginPage } from './login';

/**
 * Khối "tài khoản mẫu" trên trang đăng nhập chỉ hiện khi `environment.useMock`.
 * Cờ này bật/tắt được theo giai đoạn nên test phải tự quyết định chế độ thay vì
 * phụ thuộc giá trị đang có trong `environment.ts` (đang là `false` để chạy backend thật).
 */
vi.mock('@env/environment', () => ({
  environment: {
    production: false,
    apiBaseUrl: 'http://localhost:8000/api',
    useMock: true,
  },
}));

describe('LoginPage', () => {
  const user: NguoiDung = {
    id: 1,
    name: 'Sinh viên',
    email: 'student@example.com',
    avatar_url: null,
    vai_tro: 'SINH_VIEN',
    trang_thai: true,
    must_change_password: false,
    ho_so: null,
  };

  function taoTrang(vaiTroDangNhap: string, userDangNhap = user) {
    const auth = {
      dangNhap: vi.fn(() => of(userDangNhap)),
      xoaPhien: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ vaiTroDangNhap }),
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { auth, fixture };
  }

  it('uses a student number field and displays the other role portals', () => {
    const { fixture } = taoTrang('SINH_VIEN');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('label[for="tai-khoan"]')?.textContent).toContain('Mã sinh viên');
    expect(root.querySelector('#tai-khoan')?.getAttribute('type')).toBe('text');
    expect(root.querySelector('.trang')?.classList.contains('sinh-vien')).toBe(true);
    expect(root.querySelector('a[routerLink="/dang-nhap/admin"]')).not.toBeNull();
    expect(root.querySelector('a[routerLink="/dang-nhap/giang-vien"]')).not.toBeNull();
  });

  it('shows mock credentials on the matching demo login portal', () => {
    environment.useMock = true;
    const { fixture } = taoTrang('SINH_VIEN');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('2000000');
    expect(root.textContent).toContain('QllhMock2026!');

    root.querySelector<HTMLButtonElement>('.tai-khoan-mau button')?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.taiKhoan()).toBe('2000000');
    expect(fixture.componentInstance.matKhau()).toBe('QllhMock2026!');
  });

  it('hides the mock credentials block when running against the real backend', () => {
    environment.useMock = false;

    try {
      const { fixture } = taoTrang('SINH_VIEN');
      const root = fixture.nativeElement as HTMLElement;

      expect(fixture.componentInstance.dangDungMock).toBe(false);
      expect(root.querySelector('.tai-khoan-mau')).toBeNull();
      expect(root.textContent).not.toContain('QllhMock2026!');
    } finally {
      environment.useMock = true;
    }
  });

  it('toggles password visibility with an accessible eye icon button', () => {
    const { fixture } = taoTrang('ADMIN');
    const root = fixture.nativeElement as HTMLElement;
    const password = root.querySelector<HTMLInputElement>('#mat-khau')!;
    const button = root.querySelector<HTMLButtonElement>('.hien')!;

    expect(password.type).toBe('password');
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.textContent?.trim()).toBe('');
    expect(button.getAttribute('aria-label')).toBe('Hiện mật khẩu');

    button.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(button.getAttribute('aria-label')).toBe('Ẩn mật khẩu');
  });

  it('uses the teacher portal identity and email field', () => {
    const { fixture } = taoTrang('GIANG_VIEN');
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('label[for="tai-khoan"]')?.textContent).toContain('Email giảng viên');
    expect(root.querySelector('#tai-khoan')?.getAttribute('type')).toBe('email');
    expect(root.querySelector('.trang')?.classList.contains('giang-vien')).toBe(true);
  });

  it('clears a successful session when the account role does not match the portal', () => {
    const { auth, fixture } = taoTrang('ADMIN');

    fixture.componentInstance.dangNhap(new Event('submit'));
    fixture.detectChanges();

    expect(auth.xoaPhien).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('không thuộc cổng Quản trị viên');
  });
});
