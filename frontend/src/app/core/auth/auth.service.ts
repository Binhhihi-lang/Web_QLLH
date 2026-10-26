import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { NguoiDung } from '@core/models/dao-tao.model';
import { environment } from '@env/environment';

interface PhanHoiDangNhap {
  success: boolean;
  message: string;
  data: {
    token: string;
    het_han_luc: string;
    nguoi_dung: NguoiDung;
  };
}

interface PhanHoiNguoiDung {
  success: boolean;
  message: string;
  data: NguoiDung;
}

interface PhanHoi<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;
  private readonly khoaToken = 'qllh_access_token';
  private readonly token = signal(this.docToken());

  readonly nguoiDung = signal<NguoiDung | null>(null);
  readonly daDangNhap = computed(() => this.token() !== null);

  layToken(): string | null {
    const token = this.docToken();
    if (token !== this.token()) this.token.set(token);
    return token;
  }

  dangNhap(
    taiKhoan: string,
    password: string,
    ghiNho: boolean,
    loaiTaiKhoan: 'email' | 'ma_sv' = 'email',
  ): Observable<NguoiDung> {
    const thongTinDangNhap =
      loaiTaiKhoan === 'ma_sv' ? { ma_sv: taiKhoan, password } : { email: taiKhoan, password };

    return this.http.post<PhanHoiDangNhap>(`${this.goc}/auth/login`, thongTinDangNhap).pipe(
      tap(({ data }) => {
        this.luuToken(data.token, ghiNho);
        this.nguoiDung.set(data.nguoi_dung);
      }),
      map(({ data }) => data.nguoi_dung),
    );
  }

  layNguoiDung(): Observable<NguoiDung> {
    return this.http.get<PhanHoiNguoiDung>(`${this.goc}/auth/me`).pipe(
      map(({ data }) => data),
      tap((nguoiDung) => this.nguoiDung.set(nguoiDung)),
      catchError((loi: unknown) => {
        if (loi instanceof HttpErrorResponse && loi.status === 401) {
          this.xoaPhien();
        }
        return throwError(() => loi);
      }),
    );
  }

  doiMatKhau(matKhauCu: string, password: string, passwordConfirmation: string): Observable<void> {
    return this.http
      .post<PhanHoi<null>>(`${this.goc}/auth/change-password`, {
        mat_khau_cu: matKhauCu,
        password,
        password_confirmation: passwordConfirmation,
      })
      .pipe(
        tap(() => {
          this.nguoiDung.update((nguoiDung) =>
            nguoiDung ? { ...nguoiDung, must_change_password: false } : nguoiDung,
          );
        }),
        map(() => undefined),
      );
  }

  dangXuat(): Observable<void> {
    if (!this.layToken()) {
      this.xoaPhien();
      return of(undefined);
    }

    return this.http.post<PhanHoi<null>>(`${this.goc}/auth/logout`, {}).pipe(
      map(() => undefined),
      tap(() => this.xoaPhien()),
    );
  }

  xoaPhien(): void {
    sessionStorage.removeItem(this.khoaToken);
    localStorage.removeItem(this.khoaToken);
    this.token.set(null);
    this.nguoiDung.set(null);
  }

  private luuToken(token: string, ghiNho: boolean): void {
    this.xoaTokenDaLuu();
    (ghiNho ? localStorage : sessionStorage).setItem(this.khoaToken, token);
    this.token.set(token);
  }

  private xoaTokenDaLuu(): void {
    sessionStorage.removeItem(this.khoaToken);
    localStorage.removeItem(this.khoaToken);
    this.token.set(null);
  }

  private docToken(): string | null {
    return sessionStorage.getItem(this.khoaToken) ?? localStorage.getItem(this.khoaToken);
  }
}
