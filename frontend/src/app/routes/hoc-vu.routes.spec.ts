import { DangXayDung } from '@shared/ui/dang-xay-dung';
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
});
