import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NguoiDung, VaiTro } from '@core/models/dao-tao.model';
import { AuthService } from './auth.service';

/**
 * Chọn màn hình theo vai trò — dùng cho route dùng CHUNG đường dẫn nhưng mỗi
 * vai trò cần một component khác nhau (ví dụ `/dashboard`).
 *
 * Khác `roleGuard` ở hai điểm quyết định:
 * 1. `CanMatchFn` chứ không phải `CanActivateFn`. Guard chạy TRƯỚC khi router
 *    chọn component, nên ba khai báo cùng `path: 'dashboard'` sẽ lần lượt được
 *    thử; cái đầu tiên trả `true` thắng. `CanActivate` thì component đã được
 *    chọn xong mới chạy — không đổi được màn hình.
 * 2. Không redirect. Trả `false` để router thử khai báo kế tiếp. `roleGuard`
 *    redirect về `/dashboard` nên gắn nó cho chính `/dashboard` là vòng lặp vô hạn.
 *
 * Chưa đăng nhập cũng trả `false` — để `authGuard` ở route cha lo việc chuyển
 * về trang đăng nhập, không gọi API hai lần và không nhận 401 ở đây.
 */
export const vaiTroCanMatch =
  (...choPhep: VaiTro[]): CanMatchFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.layToken()) return false;

    const khop = (nguoiDung: NguoiDung): boolean => choPhep.includes(nguoiDung.vai_tro);

    const daCo = auth.nguoiDung();
    if (daCo) return khop(daCo);

    return auth.layNguoiDung().pipe(
      map(khop),
      catchError((loi: unknown) => {
        if (loi instanceof HttpErrorResponse && loi.status === 401) return of(false);
        return throwError(() => loi);
      }),
    ) as Observable<boolean>;
  };
