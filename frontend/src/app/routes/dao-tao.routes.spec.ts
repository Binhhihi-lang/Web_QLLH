import { daoTaoRoutes } from './dao-tao.routes';

describe('daoTaoRoutes Khoa and Ngành management', () => {
  it('exposes detail routes for khoa and ngành to ADMIN only', () => {
    const detailRoutes = daoTaoRoutes.filter((route) =>
      ['khoa/:id', 'nganh/:id'].includes(route.path ?? ''),
    );

    expect(detailRoutes.map((route) => route.path)).toEqual(['khoa/:id', 'nganh/:id']);
    expect(detailRoutes.every((route) => route.data?.['roles']?.[0] === 'ADMIN')).toBe(true);
  });

  it('exposes Khoa and Ngành list and form routes to ADMIN only', () => {
    const managedRoutes = daoTaoRoutes.filter((route) =>
      ['khoa', 'khoa/them', 'khoa/:id/sua', 'nganh', 'nganh/them', 'nganh/:id/sua'].includes(
        route.path ?? '',
      ),
    );

    expect(managedRoutes.map((route) => route.path)).toEqual([
      'khoa',
      'khoa/them',
      'khoa/:id/sua',
      'nganh',
      'nganh/them',
      'nganh/:id/sua',
    ]);
    expect(managedRoutes.every((route) => route.data?.['roles']?.length === 1)).toBe(true);
    expect(managedRoutes.every((route) => route.data?.['roles']?.[0] === 'ADMIN')).toBe(true);
  });
});
