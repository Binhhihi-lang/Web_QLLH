import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HocKy, ThamSoDanhSach, TrangThaiHocKy } from '@core/models/dao-tao.model';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface ThamSoDanhSachHocKy extends ThamSoDanhSach {
  nam_hoc?: string;
  ky_thu?: number;
  trang_thai?: TrangThaiHocKy;
}

export interface HocKyInput {
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  nam_hoc: string;
  ky_thu: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  mo_dang_ky_luc: string;
  dong_dang_ky_luc: string;
}

@Injectable({ providedIn: 'root' })
export class HocKyService {
  private readonly http = inject(HttpClient);
  private readonly goc = `${environment.apiBaseUrl}/semesters`;

  layDanhSach(thamSo: ThamSoDanhSachHocKy): Observable<PaginatedResponse<HocKy>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(thamSo)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get<PaginatedResponse<HocKy>>(this.goc, { params });
  }

  layMot(id: number): Observable<HocKy> {
    return this.http.get<{ data: HocKy }>(`${this.goc}/${id}`).pipe(map(({ data }) => data));
  }

  taoMoi(input: HocKyInput): Observable<HocKy> {
    return this.http.post<{ data: HocKy }>(this.goc, input).pipe(map(({ data }) => data));
  }

  capNhat(id: number, input: HocKyInput): Observable<HocKy> {
    return this.http.put<{ data: HocKy }>(`${this.goc}/${id}`, input).pipe(map(({ data }) => data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/${id}`);
  }

  doiTrangThai(id: number, trangThai: TrangThaiHocKy): Observable<HocKy> {
    return this.http
      .patch<{ data: HocKy }>(`${this.goc}/${id}/status`, { trang_thai: trangThai })
      .pipe(map(({ data }) => data));
  }
}
