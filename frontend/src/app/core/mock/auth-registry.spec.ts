import { TestBed } from '@angular/core/testing';
import { MockRegistry } from './mock-registry';

describe('MockRegistry authentication', () => {
  let registry: MockRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MockRegistry] });
    registry = TestBed.inject(MockRegistry);
  });

  it('authenticates demo accounts for all three roles', () => {
    const taiKhoan = [
      { email: 'admin@qllh.test', vaiTro: 'ADMIN' },
      { email: 'gv0001@university.edu.vn', vaiTro: 'GIANG_VIEN' },
      { ma_sv: '2000000', vaiTro: 'SINH_VIEN' },
    ];

    for (const taiKhoanThu of taiKhoan) {
      const response = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
        ...taiKhoanThu,
        password: 'QllhMock2026!',
      }) as any;

      expect(response.success).toBe(true);
      expect(response.data.nguoi_dung.vai_tro).toBe(taiKhoanThu.vaiTro);
      expect(response.data.token).toBeTruthy();

      const currentUser = registry.resolve(
        'GET',
        'http://localhost:8000/api/auth/me',
        null,
        `Bearer ${response.data.token}`,
      ) as any;
      expect(currentUser.data.vai_tro).toBe(taiKhoanThu.vaiTro);
    }
  });

  it('rejects unknown accounts and incorrect passwords', () => {
    const response = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
      email: 'admin@qllh.test',
      password: 'incorrect',
    }) as any;

    expect(response.success).toBe(false);
    expect(response.ma_loi).toBe('UNAUTHENTICATED');
  });

  it('restores the user from a mock token and invalidates it on logout', () => {
    const dangNhap = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
      email: 'admin@qllh.test',
      password: 'QllhMock2026!',
    }) as any;
    const authorization = `Bearer ${dangNhap.data.token}`;

    const nguoiDung = registry.resolve(
      'GET',
      'http://localhost:8000/api/auth/me',
      null,
      authorization,
    ) as any;
    expect(nguoiDung.data.vai_tro).toBe('ADMIN');

    const dangXuat = registry.resolve(
      'POST',
      'http://localhost:8000/api/auth/logout',
      {},
      authorization,
    ) as any;
    expect(dangXuat.success).toBe(true);

    const sauDangXuat = registry.resolve(
      'GET',
      'http://localhost:8000/api/auth/me',
      null,
      authorization,
    ) as any;
    expect(sauDangXuat.success).toBe(false);
    expect(sauDangXuat.ma_loi).toBe('UNAUTHENTICATED');
  });

  it('restores a saved mock token after the mock registry is recreated', () => {
    const dangNhap = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
      email: 'gv0001@university.edu.vn',
      password: 'QllhMock2026!',
    }) as any;
    const registryMoi = new MockRegistry();

    const nguoiDung = registryMoi.resolve(
      'GET',
      'http://localhost:8000/api/auth/me',
      null,
      `Bearer ${dangNhap.data.token}`,
    ) as any;

    expect(nguoiDung.data.vai_tro).toBe('GIANG_VIEN');
  });

  it('changes the password for an authenticated demo account', () => {
    const dangNhap = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
      email: 'admin@qllh.test',
      password: 'QllhMock2026!',
    }) as any;
    const authorization = `Bearer ${dangNhap.data.token}`;

    const doiMatKhau = registry.resolve(
      'POST',
      'http://localhost:8000/api/auth/change-password',
      {
        mat_khau_cu: 'QllhMock2026!',
        password: 'NewMock2026!',
        password_confirmation: 'NewMock2026!',
      },
      authorization,
    ) as any;
    expect(doiMatKhau.success).toBe(true);

    const dangNhapLai = registry.resolve('POST', 'http://localhost:8000/api/auth/login', {
      email: 'admin@qllh.test',
      password: 'NewMock2026!',
    }) as any;
    expect(dangNhapLai.success).toBe(true);
  });
});
