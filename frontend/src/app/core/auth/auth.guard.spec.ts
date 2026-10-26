import { VaiTro } from '@core/models/dao-tao.model';
import { NguoiDung } from '@core/models/dao-tao.model';
import { coQuyenVaoRoute } from './auth.guard';

describe('coQuyenVaoRoute', () => {
  const nguoiDung = (vaiTro: VaiTro, hoSoId: number | null = null): NguoiDung => ({
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    avatar_url: null,
    vai_tro: vaiTro,
    trang_thai: true,
    must_change_password: false,
    ho_so: hoSoId === null ? null : { loai: 'giang_vien', id: hoSoId, ho_ten: 'Giảng viên' },
  });

  it('allows a user whose role is listed on the route', () => {
    expect(coQuyenVaoRoute(nguoiDung('ADMIN'), ['ADMIN'])).toBe(true);
  });

  it('redirects a user with the wrong role to the dashboard', () => {
    expect(coQuyenVaoRoute(nguoiDung('SINH_VIEN'), ['ADMIN'])).toBe(false);
  });

  it('allows a teacher to edit only their own profile route', () => {
    expect(coQuyenVaoRoute(nguoiDung('GIANG_VIEN', 8), ['ADMIN', 'GIANG_VIEN'], true, '8')).toBe(
      true,
    );
  });

  it('redirects a teacher away from another teacher profile route', () => {
    expect(coQuyenVaoRoute(nguoiDung('GIANG_VIEN', 8), ['ADMIN', 'GIANG_VIEN'], true, '9')).toBe(
      false,
    );
  });
});
