import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MonHoc, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface MonHocInput {
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  mo_ta: string | null;
  trang_thai: boolean;
}

export interface ThamSoDanhSachMonHoc extends ThamSoDanhSach {
  trang_thai?: boolean;
  so_tin_chi?: number;
}

@Injectable({ providedIn: 'root' })
export class MonHocService {
  private readonly http = inject(HttpClient);
  private readonly goc = `${environment.apiBaseUrl}/subjects`;

  layDanhSach(thamSo: ThamSoDanhSachMonHoc): Observable<PaginatedResponse<MonHoc>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(thamSo)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get<PaginatedResponse<MonHoc>>(this.goc, { params });
  }

  layMot(id: number): Observable<MonHoc> {
    return this.http
      .get<{ data: MonHoc }>(`${this.goc}/${id}`)
      .pipe(map((response) => response.data));
  }

  taoMoi(input: MonHocInput): Observable<MonHoc> {
    return this.http.post<{ data: MonHoc }>(this.goc, input).pipe(map((response) => response.data));
  }

  capNhat(id: number, input: MonHocInput): Observable<MonHoc> {
    return this.http
      .put<{ data: MonHoc }>(`${this.goc}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/${id}`);
  }

  doiTrangThai(id: number, trangThai: boolean): Observable<MonHoc> {
    return this.http
      .patch<{ data: MonHoc }>(`${this.goc}/${id}/status`, { trang_thai: trangThai })
      .pipe(map((response) => response.data));
  }

  doiTrangThaiHangLoat(ids: number[], trangThai: boolean): Observable<KetQuaHangLoat> {
    return this.http
      .patch<{ data: KetQuaHangLoat }>(`${this.goc}/bulk-status`, {
        ids,
        trang_thai: trangThai,
      })
      .pipe(map((response) => response.data));
  }

  xoaHangLoat(ids: number[]): Observable<KetQuaHangLoat> {
    return this.http
      .post<{ data: KetQuaHangLoat }>(`${this.goc}/bulk-delete`, { ids })
      .pipe(map((response) => response.data));
  }
}
