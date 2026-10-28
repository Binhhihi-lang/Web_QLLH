import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface MenuApi {
  id: number;
  ten: string;
  url: string;
  vi_tri: 'header' | 'sidebar';
  nhom: string | null;
  vai_tro: Array<'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN'> | null;
  thu_tu: number;
  trang_thai: boolean;
}

export type MenuInput = Omit<MenuApi, 'id'>;

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;
  readonly phienBan = signal(0);

  layMenuSidebar(): Observable<MenuApi[]> {
    return this.layTheoViTri('sidebar');
  }

  layMenuHeader(): Observable<MenuApi[]> {
    return this.layTheoViTri('header');
  }

  /** Mọi menu đang hiển thị mà vai trò hiện tại được thấy, cả hai vị trí. */
  layMenuHienThi(): Observable<MenuApi[]> {
    return this.http.get<{ data: MenuApi[] }>(`${this.goc}/menus`).pipe(map(({ data }) => data));
  }

  private layTheoViTri(viTri: MenuApi['vi_tri']): Observable<MenuApi[]> {
    const params = new HttpParams().set('vi_tri', viTri);
    return this.http
      .get<{ data: MenuApi[] }>(`${this.goc}/menus`, { params })
      .pipe(map(({ data }) => data));
  }

  layDanhSach(): Observable<MenuApi[]> {
    const params = new HttpParams().set('quan_ly', '1');
    return this.http
      .get<{ data: MenuApi[] }>(`${this.goc}/menus`, { params })
      .pipe(map(({ data }) => data));
  }

  /** Một mục menu theo id — dùng cho trang chi tiết, không tải cả danh sách. */
  layMot(id: number): Observable<MenuApi> {
    return this.http
      .get<{ data: MenuApi }>(`${this.goc}/menus/${id}`)
      .pipe(map(({ data }) => data));
  }

  tao(duLieu: MenuInput): Observable<MenuApi> {
    return this.http
      .post<{ data: MenuApi }>(`${this.goc}/menus`, duLieu)
      .pipe(map(({ data }) => data), tap(() => this.baoMenuThayDoi()));
  }

  capNhat(id: number, duLieu: MenuInput): Observable<MenuApi> {
    return this.http
      .put<{ data: MenuApi }>(`${this.goc}/menus/${id}`, duLieu)
      .pipe(
        map(({ data }) => data),
        tap(() => this.baoMenuThayDoi()),
      );
  }

  xoa(id: number): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/menus/${id}`)
      .pipe(
        map(() => undefined),
        tap(() => this.baoMenuThayDoi()),
      );
  }

  private baoMenuThayDoi(): void {
    this.phienBan.update((version) => version + 1);
  }
}
