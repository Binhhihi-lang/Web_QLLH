import { vaiTroDuocThayMenu } from './menu-vai-tro';

describe('vaiTroDuocThayMenu', () => {
  it('shows shared entries to every role', () => {
    expect(vaiTroDuocThayMenu('ADMIN', null)).toBe(true);
    expect(vaiTroDuocThayMenu('GIANG_VIEN', null)).toBe(true);
    expect(vaiTroDuocThayMenu('SINH_VIEN', null)).toBe(true);
  });

  it('treats an empty role list the same as null', () => {
    expect(vaiTroDuocThayMenu('SINH_VIEN', [])).toBe(true);
  });

  it('shows ADMIN entries that explicitly list ADMIN', () => {
    expect(vaiTroDuocThayMenu('ADMIN', ['ADMIN'])).toBe(true);
    expect(vaiTroDuocThayMenu('ADMIN', ['ADMIN', 'GIANG_VIEN'])).toBe(true);
  });

  it('hides entries that do not list the current role', () => {
    expect(vaiTroDuocThayMenu('GIANG_VIEN', ['ADMIN'])).toBe(false);
    expect(vaiTroDuocThayMenu('GIANG_VIEN', ['SINH_VIEN'])).toBe(false);

    expect(vaiTroDuocThayMenu('SINH_VIEN', ['ADMIN'])).toBe(false);
    expect(vaiTroDuocThayMenu('SINH_VIEN', ['GIANG_VIEN'])).toBe(false);

    // Mục cá nhân của sinh viên: ADMIN không có hồ sơ sinh viên nên không thấy.
    expect(vaiTroDuocThayMenu('ADMIN', ['SINH_VIEN'])).toBe(false);
  });

  it('shows an entry shared between several roles to each of them', () => {
    const chung = ['ADMIN', 'GIANG_VIEN'] as const;

    expect(vaiTroDuocThayMenu('ADMIN', [...chung])).toBe(true);
    expect(vaiTroDuocThayMenu('GIANG_VIEN', [...chung])).toBe(true);
    expect(vaiTroDuocThayMenu('SINH_VIEN', [...chung])).toBe(false);
  });
});
