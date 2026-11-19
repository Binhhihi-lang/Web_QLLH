import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface NhatKyNguoiThucHien {
  id: number;
  name: string;
  email: string;
  vai_tro: string;
}

export interface NhatKy {
  id: number;
  doi_tuong_loai: string;
  doi_tuong_loai_label: string;
  doi_tuong_id: number;
  hanh_dong: string;
  hanh_dong_label: string;
  gia_tri_cu: Record<string, unknown> | null;
  gia_tri_moi: Record<string, unknown> | null;
  ghi_chu: string | null;
  thoi_diem: string | null;
  nguoi_thuc_hien: NhatKyNguoiThucHien | null;
  created_at: string | null;
}

export interface NhatKyTuyChon {
  value: string;
  label: string;
}

export interface NhatKyBoLoc {
  q?: string;
  doi_tuong_loai?: string;
  hanh_dong?: string;
  tu_ngay?: string;
  den_ngay?: string;
  page: number;
  per_page: 10 | 25 | 50 | 100;
  sort_by: 'thoi_diem';
  sort_dir: 'desc';
}

export interface NhatKyTuyChonBoLoc {
  doi_tuong_loai: NhatKyTuyChon[];
  hanh_dong: NhatKyTuyChon[];
}

@Injectable({ providedIn: 'root' })
export class NhatKyService {
  private readonly http = inject(HttpClient);
  private readonly goc = `${environment.apiBaseUrl}/logs`;

  layDanhSach(boloc: NhatKyBoLoc): Observable<PaginatedResponse<NhatKy>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(boloc)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<NhatKy>>(this.goc, { params });
  }

  layTuyChon(): Observable<NhatKyTuyChonBoLoc> {
    return this.http
      .get<ApiResponse<NhatKyTuyChonBoLoc>>(`${this.goc}/options`)
      .pipe(map((response) => response.data));
  }

  layChiTiet(id: number): Observable<NhatKy> {
    return this.http
      .get<ApiResponse<NhatKy>>(`${this.goc}/${id}`)
      .pipe(map((response) => response.data));
  }
}

