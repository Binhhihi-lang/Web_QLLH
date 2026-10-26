import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const laApi = request.url.startsWith(environment.apiBaseUrl);
  const laDangNhap = request.url.endsWith('/auth/login');
  const token = laApi && !laDangNhap ? auth.layToken() : null;
  const requestCoToken = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(requestCoToken).pipe(
    catchError((loi: unknown) => {
      if (loi instanceof HttpErrorResponse && loi.status === 401 && token) {
        auth.xoaPhien();
        if (router.url !== '/dang-nhap') {
          void router.navigate(['/dang-nhap'], {
            queryParams: { returnUrl: router.url },
          });
        }
      }
      return throwError(() => loi);
    }),
  );
};
