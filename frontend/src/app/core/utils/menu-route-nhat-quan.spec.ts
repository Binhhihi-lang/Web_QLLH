import { Routes } from '@angular/router';
import { MenuApi } from '@core/services/menu.service';
import { MenuRegistry } from '@core/mock/registry/menu.registry';
import { routes } from '../../app.routes';
import { vaiTroDuocThayMenu } from './menu-vai-tro';

const VAI_TRO = ['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'] as const;

/**
 * Vai trò được route cho phép.
 *
 * - `undefined` = KHÔNG tìm thấy route (menu trỏ vào hư không).
 * - `[]`        = route tồn tại nhưng không giới hạn vai trò (`/dashboard`).
 */
function vaiTroCuaRoute(duongDan: string, danhSach: Routes = routes): string[] | undefined {
  for (const route of danhSach) {
    const path = route.path ?? '';
    if (path === '**') continue;

    if (path && duongDan === `/${path}`) {
      return (route.data?.['roles'] as string[] | undefined) ?? [];
    }

    if (route.children) {
      const con = vaiTroCuaRoute(duongDan, route.children);
      if (con !== undefined) return con;
    }
  }
  return undefined;
}

function layMenuMock(): MenuApi[] {
  // `quan_ly=1` chỉ ADMIN được dùng — đây là danh sách đầy đủ để đối chiếu với
  // bảng route, không phải danh sách một vai trò nhìn thấy.
  const ketQua = new MenuRegistry().resolve(
    'GET',
    '/menus',
    { get: (khoa: string) => (khoa === 'quan_ly' ? '1' : null) } as never,
    null,
    'ADMIN',
  ) as { data: MenuApi[] };
  return ketQua.data;
}

/**
 * Menu và route phải nói cùng một chuyện — CHỈ với những URL đã có route.
 *
 * URL chưa có route là hợp lệ có chủ đích (admin khai menu trước cho màn chưa
 * code, xem `menu-url.ts`), nên bỏ qua chúng ở đây.
 *
 * Lỗi thật đã xảy ra: ADMIN mở được `/dang-ky` và `/diem-danh` (route cho phép)
 * nhưng sidebar lại giấu hai mục đó (menu gắn vai trò khác). Ngược lại, sinh
 * viên thấy mục "Đăng ký" nhưng bấm vào bị đá về dashboard vì route chỉ cho ADMIN.
 *
 * Lưu ý: `roleGuard` KHÔNG có ngoại lệ cho ADMIN — nó so khớp `data.roles`
 * tuyệt đối. Vì vậy `/dang-ky-cua-toi` (chỉ SINH_VIEN) thì ADMIN cũng bị chặn,
 * và menu tương ứng cũng không được ghi ADMIN.
 */
describe('menu khớp quyền route', () => {
  /** Route cho vai trò này vào? Mảng rỗng = route không giới hạn vai trò. */
  function vaoDuocRoute(vaiTro: string, roles: string[]): boolean {
    return roles.length === 0 || roles.includes(vaiTro);
  }

  it('every role that can open a page also sees its menu entry', () => {
    const viPham: string[] = [];

    for (const menu of layMenuMock()) {
      const roles = vaiTroCuaRoute(menu.url);
      if (!roles) continue;

      for (const vaiTro of VAI_TRO) {
        if (vaoDuocRoute(vaiTro, roles) && !vaiTroDuocThayMenu(vaiTro, menu.vai_tro)) {
          viPham.push(`${vaiTro} vào được ${menu.url} nhưng không thấy menu "${menu.ten}"`);
        }
      }
    }

    expect(viPham).toEqual([]);
  });

  it('no menu entry is shown to a role that the route blocks', () => {
    const viPham: string[] = [];

    for (const menu of layMenuMock()) {
      const roles = vaiTroCuaRoute(menu.url);
      if (!roles) continue;

      for (const vaiTro of VAI_TRO) {
        if (vaiTroDuocThayMenu(vaiTro, menu.vai_tro) && !vaoDuocRoute(vaiTro, roles)) {
          viPham.push(`${vaiTro} thấy menu "${menu.ten}" nhưng ${menu.url} chặn vai trò này`);
        }
      }
    }

    expect(viPham).toEqual([]);
  });
});
