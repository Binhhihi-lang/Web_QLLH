import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LopHocPhan, ThamSoDanhSach, TrangThaiLopHocPhan } from '@core/models/dao-tao.model';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface BoLocLopHocPhan extends ThamSoDanhSach {
  hoc_ky_id?: number;
  mon_hoc_id?: number;
  giang_vien_id?: number;
  nam_thu?: number;
  trang_thai?: TrangThaiLopHocPhan;
  con_cho?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LopHocPhanService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(boLoc: BoLocLopHocPhan): Observable<PaginatedResponse<LopHocPhan>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(boLoc)) {
      if (value !== null && value !== undefined && value !== '')
        params = params.set(key, String(value));
    }
    return this.http.get<PaginatedResponse<LopHocPhan>>(`${this.goc}/sections`, { params });
  }

  layTuyChon(duongDan: 'semesters' | 'subjects' | 'teachers'): Observable<TuyChon[]> {
    return this.http
      .get<{ data: TuyChon[] }>(`${this.goc}/options/${duongDan}`)
      .pipe(map((response) => response.data));
  }

  layMot(id: number): Observable<LopHocPhan> {
    return this.http
      .get<{ data: LopHocPhan }>(`${this.goc}/sections/${id}`)
      .pipe(map((response) => response.data));
  }

  tao(data: LopHocPhanInput): Observable<LopHocPhan> {
    return this.http
      .post<{ data: LopHocPhan }>(`${this.goc}/sections`, data)
      .pipe(map((response) => response.data));
  }

  capNhat(id: number, data: LopHocPhanInput): Observable<LopHocPhan> {
    return this.http
      .put<{ data: LopHocPhan }>(`${this.goc}/sections/${id}`, data)
      .pipe(map((response) => response.data));
  }

  xoa(id: number): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/sections/${id}`)
      .pipe(map(() => undefined));
  }

  huyDangKy(id: number, ly_do: string): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/enrollments/${id}`, { body: { ly_do } })
      .pipe(map(() => undefined));
  }

  doiTrangThai(id: number, trang_thai: TrangThaiLopHocPhan): Observable<LopHocPhan> {
    return this.http
      .patch<{ data: LopHocPhan }>(`${this.goc}/sections/${id}/status`, { trang_thai })
      .pipe(map((response) => response.data));
  }

  laySinhVien(id: number): Observable<SinhVienLop[]> {
    return this.http
      .get<{ data: SinhVienLop[] }>(`${this.goc}/sections/${id}/students`)
      .pipe(map((response) => response.data));
  }

  layDiem(id: number): Observable<DongDiem[]> {
    return this.http
      .get<{ data: DongDiem[] }>(`${this.goc}/sections/${id}/grades`)
      .pipe(map((response) => response.data));
  }

  capNhatDiem(id: number, diem: DongDiem[]): Observable<DongDiem[]> {
    const payload: DiemNhap[] = diem.map((row) => ({
      dang_ky_hoc_phan_id: row.dang_ky_hoc_phan_id,
      diem_chuyen_can: row.diem_chuyen_can,
      diem_giua_ky: row.diem_giua_ky,
      diem_cuoi_ky: row.diem_cuoi_ky,
    }));
    return this.http
      .put<{ data: DongDiem[] }>(`${this.goc}/sections/${id}/grades`, { diem: payload })
      .pipe(map((response) => response.data));
  }

  chotDiem(id: number): Observable<LopHocPhan> {
    return this.http
      .post<{ data: LopHocPhan }>(`${this.goc}/sections/${id}/finalize`, {})
      .pipe(map((response) => response.data));
  }
}

export interface TuyChon {
  id: number;
  label: string;
}
export interface LopHocPhanInput {
  ma_lop_hp: string;
  mon_hoc_id: number;
  hoc_ky_id: number;
  giang_vien_id: number;
  si_so_toi_da: number;
  nam_thu: number | null;
  trang_thai: TrangThaiLopHocPhan;
}
export interface SinhVienLop {
  id: number;
  ma_sv: string;
  ho_ten: string;
  email: string;
  lop: string | null;
  dang_ky_hoc_phan_id: number;
}
export interface DongDiem {
  dang_ky_hoc_phan_id: number;
  sinh_vien: SinhVienLop;
  diem_chuyen_can: number | null;
  diem_giua_ky: number | null;
  diem_cuoi_ky: number | null;
  diem_tong_ket: number | null;
  diem_chu: string | null;
  diem_he_4: number | null;
}
export interface DiemNhap {
  dang_ky_hoc_phan_id: number;
  diem_chuyen_can: number | null;
  diem_giua_ky: number | null;
  diem_cuoi_ky: number | null;
}
