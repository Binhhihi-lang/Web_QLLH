import { AuthRegistry, TAI_KHOAN_DANG_NHAP_MOCK } from './auth.registry';
import { MockRegistry } from '@core/mock/mock-registry';

describe('AuthRegistry profile updates', () => {
  it('accepts only profile fields allowed for the authenticated role', () => {
    const persistedProfile = vi.fn();
    const registry = new AuthRegistry(persistedProfile);
    const login = registry.resolve(
      'POST',
      '/auth/login',
      { ma_sv: TAI_KHOAN_DANG_NHAP_MOCK[2].taiKhoan, password: 'QllhMock2026!' },
      null,
    ) as { data: { token: string } };
    const authorization = `Bearer ${login.data.token}`;

    const updated = registry.resolve(
      'PUT',
      '/me',
      {
        so_dien_thoai: '0901234567',
        dia_chi: 'Hà Nội',
        name: 'Tên không được phép sửa',
      },
      authorization,
    ) as { success: boolean; data: { name: string } };

    expect(updated.success).toBe(true);
    expect(updated.data.name).not.toBe('Tên không được phép sửa');
    expect(persistedProfile).toHaveBeenCalledWith(
      expect.objectContaining({ vai_tro: 'SINH_VIEN' }),
      { so_dien_thoai: '0901234567', dia_chi: 'Hà Nội' },
    );
  });

  it('returns an authentication error when an unauthenticated user updates a profile', () => {
    const registry = new AuthRegistry();
    const response = registry.resolve('PUT', '/me', { name: 'Tên mới' }, null) as {
      success: boolean;
      ma_loi: string;
    };

    expect(response.success).toBe(false);
    expect(response.ma_loi).toBe('UNAUTHENTICATED');
  });

  it('persists student contact changes in the mock profile endpoint', () => {
    const registry = new MockRegistry();
    const login = registry.resolve('POST', '/api/auth/login', {
      ma_sv: TAI_KHOAN_DANG_NHAP_MOCK[2].taiKhoan,
      password: 'QllhMock2026!',
    }) as { data: { token: string } };
    const authorization = `Bearer ${login.data.token}`;

    registry.resolve(
      'PUT',
      '/api/me',
      { so_dien_thoai: '0901234567', dia_chi: 'Hà Nội' },
      authorization,
    );
    const profile = registry.resolve('GET', '/api/students/1', null, authorization) as {
      data: { so_dien_thoai: string; dia_chi: string };
    };

    expect(profile.data).toMatchObject({ so_dien_thoai: '0901234567', dia_chi: 'Hà Nội' });
  });
});
