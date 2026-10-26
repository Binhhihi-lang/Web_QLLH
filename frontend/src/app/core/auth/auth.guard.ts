import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, map, of, throwError } from 'rxjs';
import { NguoiDung, VaiTro } from '@core/models/dao-tao.model';
import { AuthService } from './auth.service';

function kiemTraPhien(
  auth: AuthService,
  router: Router,
  url: string,
): boolean | UrlTree | Observable<boolean | UrlTree> {
  const duongDan = url.split('?')[0];

  if (!auth.layToken()) {
    return router.createUrlTree(['/dang-nhap'], { queryParams: { returnUrl: url } });
  }

  const kiemTraNguoiDung = (nguoiDung: NguoiDung): boolean | UrlTree => {
    if (nguoiDung.must_change_password && duongDan !== '/doi-mat-khau') {
      return router.parseUrl('/doi-mat-khau');
    }
    return true;
  };

  const nguoiDung = auth.nguoiDung();
  if (nguoiDung) return kiemTraNguoiDung(nguoiDung);

  return auth.layNguoiDung().pipe(
    map(kiemTraNguoiDung),
    catchError((loi: unknown) => {
      if (loi instanceof HttpErrorResponse && loi.status === 401) {
        return of(router.createUrlTree(['/dang-nhap'], { queryParams: { returnUrl: url } }));
      }
      return throwError(() => loi);
    }),
  );
}

export const authGuard: CanActivateFn = (_route, state) =>
  kiemTraPhien(inject(AuthService), inject(Router), state.url);

export const authChildGuard: CanActivateChildFn = (_route, state) =>
  kiemTraPhien(inject(AuthService), inject(Router), state.url);

export const guestGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const denSauDangNhap = (nguoiDung: NguoiDung): UrlTree =>
    router.parseUrl(nguoiDung.must_change_password ? '/doi-mat-khau' : '/dashboard');

  if (!auth.layToken()) return true;
  const nguoiDung = auth.nguoiDung();
  if (nguoiDung) return denSauDangNhap(nguoiDung);

  return auth.layNguoiDung().pipe(
    map(denSauDangNhap),
    catchError((loi: unknown) => {
      if (loi instanceof HttpErrorResponse && loi.status === 401) return of(true);
      return throwError(() => loi);
    }),
  );
};

export function coQuyenVaoRoute(
  nguoiDung: NguoiDung | null,
  vaiTroChoPhep?: VaiTro[],
  chiHoSoGiangVienCuaMinh = false,
  idHoSo?: string | null,
): boolean {
  if (!nguoiDung) return false;
  if (vaiTroChoPhep && !vaiTroChoPhep.includes(nguoiDung.vai_tro)) return false;

  if (chiHoSoGiangVienCuaMinh && nguoiDung.vai_tro === 'GIANG_VIEN') {
    return nguoiDung.ho_so?.loai === 'giang_vien' && `${nguoiDung.ho_so.id}` === idHoSo;
  }
  return true;
}

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as VaiTro[] | undefined;
  const ownTeacherProfile = route.data['ownTeacherProfile'] === true;
  const allowed = coQuyenVaoRoute(
    auth.nguoiDung(),
    roles,
    ownTeacherProfile,
    route.paramMap.get('id'),
  );

  return allowed || router.parseUrl('/dashboard');
};
