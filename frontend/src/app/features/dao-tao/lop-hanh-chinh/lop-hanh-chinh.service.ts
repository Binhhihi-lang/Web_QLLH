import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LopHanhChinh, SinhVien, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface LopHanhChinhInput {
  ma_lop: string;
  ten_lop: string;
  khoa_hoc: string | null;
  nganh: string | null;
  nam_nhap_hoc: number | null;
  mo_ta: string | null;
  trang_thai: boolean;
}

export interface LopHanhChinhChiTiet extends LopHanhChinh {
  mo_ta: string | null;
}

export interface ThamSoDanhSachLopHanhChinh extends ThamSoDanhSach {
  khoa_hoc?: string;
  nganh?: string;
  trang_thai?: boolean;
}

export interface SinhVienLopInput extends ThamSoDanhSach {
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class LopHanhChinhService {
  private readonly http = inject(HttpClient);

  private readonly goc = `${environment.apiBaseUrl}/admin-classes`;

  layDanhSach(thamSo: ThamSoDanhSachLopHanhChinh): Observable<PaginatedResponse<LopHanhChinh>> {
    return this.http.get<PaginatedResponse<LopHanhChinh>>(this.goc, {
      params: this.taoParams(thamSo),
    });
  }

  layMot(id: number): Observable<LopHanhChinhChiTiet> {
    return this.http
      .get<{ data: LopHanhChinhChiTiet }>(`${this.goc}/${id}`)
      .pipe(map((response) => response.data));
  }

  taoMoi(input: LopHanhChinhInput): Observable<LopHanhChinhChiTiet> {
    return this.http
      .post<{ data: LopHanhChinhChiTiet }>(this.goc, input)
      .pipe(map((response) => response.data));
  }

  capNhat(id: number, input: LopHanhChinhInput): Observable<LopHanhChinhChiTiet> {
    return this.http
      .put<{ data: LopHanhChinhChiTiet }>(`${this.goc}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/${id}`);
  }

  laySinhVien(
    lopId: number,
    thamSo: SinhVienLopInput,
  ): Observable<PaginatedResponse<SinhVien>> {
    return this.http.get<PaginatedResponse<SinhVien>>(`${this.goc}/${lopId}/students`, {
      params: this.taoParams(thamSo),
    });
  }

  timSinhVien(q: string): Observable<PaginatedResponse<SinhVien>> {
    return this.http.get<PaginatedResponse<SinhVien>>(`${environment.apiBaseUrl}/students`, {
      params: this.taoParams({ q, page: 1, per_page: 25, sort_by: 'ho_ten', sort_dir: 'asc' }),
    });
  }

  ganSinhVien(lopId: number, sinhVienIds: number[]): Observable<void> {
    return this.http
      .post(`${this.goc}/${lopId}/students`, { sinh_vien_ids: sinhVienIds })
      .pipe(map(() => undefined));
  }

  goSinhVien(lopId: number, sinhVienId: number): Observable<void> {
    return this.http
      .delete(`${this.goc}/${lopId}/students/${sinhVienId}`)
      .pipe(map(() => undefined));
  }

  private taoParams(input: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }
}
