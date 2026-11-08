import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

export interface DiemMonHoc {
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  diem_chuyen_can: number | null;
  diem_giua_ky: number | null;
  diem_cuoi_ky: number | null;
  diem_tong_ket: number | null;
  diem_chu: string | null;
  diem_he_4: number | null;
  ket_qua: 'DAT' | 'KHONG_DAT' | null;
}

export interface BangDiemHocKy {
  hoc_ky: {
    id: number;
    ma_hoc_ky: string;
    ten_hoc_ky: string;
  };
  mon_hoc: DiemMonHoc[];
  gpa_he_10: number | null;
  gpa_he_4: number | null;
  tong_tin_chi: number;
}

export interface GpaTichLuy {
  gpa_he_10: number | null;
  gpa_he_4: number | null;
  tong_tin_chi: number;
  tin_chi_dat: number;
  so_hoc_ky_da_tinh: number;
}

export interface TongQuanGpa {
  hoc_ky_hien_tai: {
    id: number;
    ma_hoc_ky: string;
    ten_hoc_ky: string;
    gpa_he_10: number | null;
    gpa_he_4: number | null;
    tong_tin_chi: number;
  } | null;
  tich_luy: GpaTichLuy;
}

export interface LichSuDiem {
  id: number;
  truong: string;
  gia_tri_cu: string | null;
  gia_tri_moi: string | null;
  nguoi_sua: string;
  ly_do: string | null;
  thoi_diem: string;
}

@Injectable({ providedIn: 'root' })
export class DiemService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDiemCuaToi(hocKyId?: number): Observable<BangDiemHocKy> {
    let params = new HttpParams();
    if (hocKyId) params = params.set('hoc_ky_id', hocKyId);
    return this.http
      .get<{ data: BangDiemHocKy }>(`${this.goc}/me/grades`, { params })
      .pipe(map((response) => response.data));
  }

  layGpa(): Observable<TongQuanGpa> {
    return this.http
      .get<{ data: TongQuanGpa }>(`${this.goc}/me/gpa`)
      .pipe(map((response) => response.data));
  }

  layLichSu(dangKyId: number): Observable<LichSuDiem[]> {
    return this.http
      .get<{ data: LichSuDiem[] }>(`${this.goc}/enrollments/${dangKyId}/grade-history`)
      .pipe(map((response) => response.data));
  }
}
