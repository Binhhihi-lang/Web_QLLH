import { routes } from './app.routes';
import { KhongTimThayTrang } from '@features/not-found/not-found';
import { TrangChuaLam } from '@features/not-found/trang-chua-lam';

describe('app routes', () => {
  const layout = routes.find((route) => route.path === '' && Array.isArray(route.children));

  it('renders the under-construction page inside the layout for menu URLs without a screen', async () => {
    const wildcard = layout?.children?.find((route) => route.path === '**');

    expect(wildcard?.redirectTo).toBeUndefined();
    expect(wildcard?.canMatch).toHaveLength(1);
    await expect(wildcard!.loadComponent!()).resolves.toBe(TrangChuaLam);
  });

  it('renders the 404 page outside the layout for URLs that no menu declares', async () => {
    const wildcard = routes.find((route) => route.path === '**');

    expect(wildcard).toBeDefined();
    expect(wildcard?.component).toBeUndefined();
    expect(wildcard?.redirectTo).toBeUndefined();
    await expect(wildcard!.loadComponent!()).resolves.toBe(KhongTimThayTrang);
  });
});
