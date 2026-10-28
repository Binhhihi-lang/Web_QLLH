import { inject } from '@angular/core';
import { CanMatchFn, UrlSegment } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { MenuService } from '@core/services/menu.service';
import { menuKhopDuongDan } from '@core/utils/menu-url';
import { Observable, catchError, map, of } from 'rxjs';

/**
 * Chỉ khớp route "màn hình chưa làm" khi URL hiện tại có trong bảng menu.
 *
 * Vì sao cần: wildcard phải chia làm hai. Menu khai trước cho màn hình tuần sau
 * thì bấm vào phải ra "Màn hình X chưa làm" **trong layout**; còn URL không ai
 * khai là 404 **không có layout**. Nếu gộp một component rồi mới quyết định bên
 * trong thì không bỏ được sidebar/header — layout đã render xong.
 *
 * Trả `false` để router thử route kế tiếp, cuối cùng rơi vào wildcard 404 nằm
 * ngoài layout.
 */
export const laTrangChuaLamGuard: CanMatchFn = (
  _route,
  segments: UrlSegment[],
): boolean | Observable<boolean> => {
  // Chưa đăng nhập thì để `authGuard` của layout đưa về trang đăng nhập kèm
  // `returnUrl`, thay vì trả 404 cho một URL có thể là thật. Gọi API menu lúc
  // này cũng chỉ nhận 401.
  if (!inject(AuthService).layToken()) return true;

  const duongDan = `/${segments.map((segment) => segment.path).join('/')}`;

  return inject(MenuService)
    .layMenuHienThi()
    .pipe(
      map((menus) => menus.some((menu) => menuKhopDuongDan(menu.url, duongDan))),
      catchError(() => of(false)),
    );
};
