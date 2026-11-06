import { NhatKyPage } from '@features/he-thong/nhat-ky/nhat-ky';
import { heThongRoutes } from './he-thong.routes';

describe('heThongRoutes', () => {
  it('routes the admin audit-log menu to the explicit API-pending screen', async () => {
    const route = heThongRoutes.find((item) => item.path === 'nhat-ky');

    expect(route?.data).toEqual(
      expect.objectContaining({ roles: ['ADMIN'], title: 'Nhật ký hệ thống' }),
    );
    await expect(route?.loadComponent?.()).resolves.toBe(NhatKyPage);
  });
});
