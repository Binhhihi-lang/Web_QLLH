import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export type TrangThaiDangKy = 'ACTIVE' | 'CANCELLED';

export interface DangKyHocPhan {
  id: number;
  sinh_vien: { id: number; ma_sv: string; ho_ten: string };
  lop_hoc_phan: {
    id: number;
    ma_lop_hp: string;
    mon_hoc: string;
    hoc_ky?: { id: number; ma_hoc_ky: string; ten_hoc_ky: string };
  };
  trang_thai: TrangThaiDangKy;
  dang_ky_boi: { id: number; name: string };
  dang_ky_luc: string;
  huy_boi: { id: number; name: string } | null;
  huy_luc: string | null;
}

export interface BoLocDangKy {
  page?: number;
  per_page?: 10 | 25 | 50 | 100;
  q?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  hoc_ky_id?: number;
  lop_hoc_phan_id?: number;
  sinh_vien_id?: number;
  trang_thai?: TrangThaiDangKy;
}

export interface KetQuaDangKyDong {
  sinh_vien_id: number;
  ma_sv: string;
  ket_qua: 'THANH_CONG' | 'THAT_BAI';
  ma_loi?: string;
  message?: string;
}

export interface KetQuaDangKyHangLoat {
  thanh_cong: number;
  that_bai: number;
  chi_tiet: KetQuaDangKyDong[];
}

export type YeuCauDangKyHangLoat =
  | { lop_hoc_phan_id: number; sinh_vien_ids: number[] }
  | { lop_hoc_phan_id: number; lop_hanh_chinh_id: number };

@Injectable({ providedIn: 'root' })
export class DangKyService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(boLoc: BoLocDangKy): Observable<PaginatedResponse<DangKyHocPhan>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(boLoc)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<DangKyHocPhan>>(`${this.goc}/enrollments`, { params });
  }

  layCuaToi(boLoc: Pick<BoLocDangKy, 'page' | 'per_page' | 'hoc_ky_id' | 'trang_thai'> = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(boLoc)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<DangKyHocPhan>>(`${this.goc}/me/enrollments`, { params });
  }

  dangKyHo(sinh_vien_id: number, lop_hoc_phan_id: number): Observable<DangKyHocPhan> {
    return this.http
      .post<{ data: DangKyHocPhan }>(`${this.goc}/enrollments`, {
        sinh_vien_id,
        lop_hoc_phan_id,
      })
      .pipe(map(({ data }) => data));
  }

  dangKyHangLoat(yeuCau: YeuCauDangKyHangLoat): Observable<KetQuaDangKyHangLoat> {
    return this.http
      .post<{ data: KetQuaDangKyHangLoat }>(`${this.goc}/enrollments/bulk`, yeuCau)
      .pipe(map(({ data }) => data));
  }

  huyDangKyHo(id: number, ly_do: string): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/enrollments/${id}`, { body: { ly_do } })
      .pipe(map(() => undefined));
  }

  dangKyCuaToi(lop_hoc_phan_id: number): Observable<DangKyHocPhan> {
    return this.http
      .post<{ data: DangKyHocPhan }>(`${this.goc}/me/enrollments`, { lop_hoc_phan_id })
      .pipe(map(({ data }) => data));
  }

  huyDangKyCuaToi(id: number): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/me/enrollments/${id}`)
      .pipe(map(() => undefined));
  }
}
