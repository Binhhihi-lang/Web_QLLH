import { DangXayDung } from '@shared/ui/dang-xay-dung';
import { DangKyHo } from '@features/hoc-vu/dang-ky/dang-ky-ho';
import { DangKyDanhSach } from '@features/hoc-vu/dang-ky/danh-sach';
import { DangKyCuaToi } from '@features/hoc-vu/dang-ky/cua-toi';
import { hocVuRoutes } from './hoc-vu.routes';

describe('hocVuRoutes', () => {
  it('routes the planned giới thiệu menu destination to the under-construction page', async () => {
    const route = hocVuRoutes.find((item) => item.path === 'gioi-thieu');

    expect(route).toBeDefined();
    expect(route?.data).toEqual(
      expect.objectContaining({
        roles: ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'],
        title: 'Giới thiệu',
        ma: 'Giới thiệu',
        chiTiet: 'Nội dung trang giới thiệu đang được chuẩn bị.',
      }),
    );
    await expect(route?.loadComponent?.()).resolves.toBe(DangXayDung);
  });

  it('routes each registration screen to its role-specific implementation', async () => {
    const admin = hocVuRoutes.find((item) => item.path === 'dang-ky');
    const list = hocVuRoutes.find((item) => item.path === 'dang-ky/danh-sach');
    const mine = hocVuRoutes.find((item) => item.path === 'dang-ky-cua-toi');

    expect(admin?.data).toEqual(expect.objectContaining({ roles: ['ADMIN'], ma: 'SCR-30' }));
    expect(list?.data).toEqual(expect.objectContaining({ roles: ['ADMIN', 'GIANG_VIEN'], ma: 'SCR-31' }));
    expect(mine?.data).toEqual(expect.objectContaining({ roles: ['SINH_VIEN'], ma: 'SCR-33' }));
    await expect(admin?.loadComponent?.()).resolves.toBe(DangKyHo);
    await expect(list?.loadComponent?.()).resolves.toBe(DangKyDanhSach);
    await expect(mine?.loadComponent?.()).resolves.toBe(DangKyCuaToi);
  });
});
