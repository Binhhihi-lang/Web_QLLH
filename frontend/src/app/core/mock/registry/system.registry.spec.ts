import { HttpParams } from '@angular/common/http';
import { SystemRegistry } from './system.registry';

describe('SystemRegistry', () => {
  let registry: SystemRegistry;

  beforeEach(() => {
    registry = new SystemRegistry();
  });

  it('requires an administrator for user and settings endpoints', () => {
    expect(registry.resolve('GET', '/users', new HttpParams(), null, 'GIANG_VIEN')).toMatchObject({
      success: false,
      ma_loi: 'FORBIDDEN',
    });
  });

  it('filters users by role and account status', () => {
    const result = registry.resolve(
      'GET',
      '/users',
      new HttpParams({ fromString: 'vai_tro=GIANG_VIEN&trang_thai=true' }),
      null,
      'ADMIN',
    ) as { data: Array<{ vai_tro: string; trang_thai: boolean }> };

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ vai_tro: 'GIANG_VIEN', trang_thai: true });
  });

  it('creates users with a one-time password and requires a password change', () => {
    const result = registry.resolve(
      'POST',
      '/users',
      new HttpParams(),
      {
        name: 'Giảng viên mới',
        email: 'new@example.edu.vn',
        vai_tro: 'GIANG_VIEN',
        trang_thai: true,
      },
      'ADMIN',
    ) as { data: { mat_khau_ban_dau: string; must_change_password: boolean } };

    expect(result.data.mat_khau_ban_dau).toBeTruthy();
    expect(result.data.must_change_password).toBe(true);
  });

  it('rejects invalid grading settings and accepts a valid partial update', () => {
    const invalid = registry.resolve(
      'PUT',
      '/settings',
      new HttpParams(),
      { 'diem.trong_so': { chuyen_can: 0.3, giua_ky: 0.3, cuoi_ky: 0.3 } },
      'ADMIN',
    ) as { success: boolean };
    const valid = registry.resolve(
      'PUT',
      '/settings',
      new HttpParams(),
      { 'diem.diem_danh.sua_trong_so_ngay': 14 },
      'ADMIN',
    ) as { success: boolean; data: Record<string, unknown> };

    expect(invalid.success).toBe(false);
    expect(valid.success).toBe(true);
    expect(valid.data['diem.diem_danh.sua_trong_so_ngay']).toBe(14);
  });
});
