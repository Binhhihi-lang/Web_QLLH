import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

export interface LichThi {
  id: number;
  hoc_ky_id: number;
  mon_hoc_id: number;
  mon_hoc: { id: number; ma_mon: string; ten_mon: string } | null;
  ngay_thi: string;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  phong_hoc: { id: number; ma_phong: string; ten_phong: string } | null;
  dot_thi: string | null;
  ghi_chu: string | null;
}

export interface LichThiInput {
  hoc_ky_id: number;
  mon_hoc_id: number;
  ngay_thi: string;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong_hoc_id: number;
  dot_thi?: string | null;
  ghi_chu?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LichThiService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(boLoc: { hoc_ky_id?: number; mon_hoc_id?: number; tu_ngay?: string; den_ngay?: string } = {}) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(boLoc)) {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<{ data: LichThi[] }>(`${this.goc}/exams`, { params }).pipe(map((r) => r.data));
  }

  tao(duLieu: LichThiInput): Observable<LichThi> {
    return this.http.post<{ data: LichThi }>(`${this.goc}/exams`, duLieu).pipe(map((r) => r.data));
  }

  capNhat(id: number, duLieu: Partial<LichThiInput>): Observable<LichThi> {
    return this.http.put<{ data: LichThi }>(`${this.goc}/exams/${id}`, duLieu).pipe(map((r) => r.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<{ data: null }>(`${this.goc}/exams/${id}`).pipe(map(() => undefined));
  }
}
