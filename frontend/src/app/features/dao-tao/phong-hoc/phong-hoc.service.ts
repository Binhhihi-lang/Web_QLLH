import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PhongHoc, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface PhongHocInput {
  ma_phong: string;
  ten_phong: string;
  suc_chua: number;
  trang_thai: boolean;
}

@Injectable({ providedIn: 'root' })
export class PhongHocService {
  private readonly http = inject(HttpClient);
  private readonly goc = `${environment.apiBaseUrl}/rooms`;

  layDanhSach(thamSo: ThamSoDanhSach & { trang_thai?: boolean }): Observable<PaginatedResponse<PhongHoc>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(thamSo)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get<PaginatedResponse<PhongHoc>>(this.goc, { params });
  }

  layMot(id: number): Observable<PhongHoc> {
    return this.http
      .get<{ data: PhongHoc }>(`${this.goc}/${id}`)
      .pipe(map((response) => response.data));
  }

  taoMoi(input: PhongHocInput): Observable<PhongHoc> {
    return this.http.post<{ data: PhongHoc }>(this.goc, input).pipe(map((response) => response.data));
  }

  capNhat(id: number, input: PhongHocInput): Observable<PhongHoc> {
    return this.http
      .put<{ data: PhongHoc }>(`${this.goc}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/${id}`);
  }

  doiTrangThaiHangLoat(ids: number[], trangThai: boolean): Observable<KetQuaHangLoat> {
    return this.http
      .patch<{ data: KetQuaHangLoat }>(`${this.goc}/bulk-status`, { ids, trang_thai: trangThai })
      .pipe(map((response) => response.data));
  }

  xoaHangLoat(ids: number[]): Observable<KetQuaHangLoat> {
    return this.http
      .post<{ data: KetQuaHangLoat }>(`${this.goc}/bulk-delete`, { ids })
      .pipe(map((response) => response.data));
  }
}
