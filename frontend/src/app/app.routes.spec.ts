import { routes } from './app.routes';
import { KhongTimThayTrang } from '@features/not-found/not-found';
import { TrangChuaLam } from '@features/not-found/trang-chua-lam';
import { TaiKhoanPage } from '@features/tai-khoan/tai-khoan';

describe('app routes', () => {
  const layout = routes.find((route) => route.path === '' && Array.isArray(route.children));

  it('renders the under-construction page inside the layout for menu URLs without a screen', async () => {
    const wildcard = layout?.children?.find((route) => route.path === '**');

    expect(wildcard?.redirectTo).toBeUndefined();
    expect(wildcard?.canMatch).toHaveLength(1);
    await expect(wildcard!.loadComponent!()).resolves.toBe(TrangChuaLam);
  });

  it('loads the personal account screen inside the authenticated layout', async () => {
    const account = layout?.children?.find((route) => route.path === 'tai-khoan');
    const wildcardIndex = layout?.children?.findIndex((route) => route.path === '**') ?? -1;
    const accountIndex = layout?.children?.findIndex((route) => route.path === 'tai-khoan') ?? -1;

    expect(account).toBeDefined();
    expect(accountIndex).toBeGreaterThanOrEqual(0);
    expect(accountIndex).toBeLessThan(wildcardIndex);
    await expect(account!.loadComponent!()).resolves.toBe(TaiKhoanPage);
  });

  it('renders the 404 page outside the layout for URLs that no menu declares', async () => {
    const wildcard = routes.find((route) => route.path === '**');

    expect(wildcard).toBeDefined();
    expect(wildcard?.component).toBeUndefined();
    expect(wildcard?.redirectTo).toBeUndefined();
    await expect(wildcard!.loadComponent!()).resolves.toBe(KhongTimThayTrang);
  });
});
