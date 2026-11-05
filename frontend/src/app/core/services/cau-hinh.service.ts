import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CauHinhDiem, CauHinhDiemApi } from '@core/models/he-thong.model';
import { environment } from '@env/environment';

export interface HocKyCauHinh {
  id: number;
  label: string;
  ma_hoc_ky: string;
  nam_hoc: string;
  ky_thu: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  mo_dang_ky_luc: string;
  dong_dang_ky_luc: string;
  trang_thai: string;
  cau_hinh_da_luu: boolean;
}

@Injectable({ providedIn: 'root' })
export class CauHinhService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/settings`;

  lay(hocKyId?: number): Observable<CauHinhDiemApi> {
    let params = new HttpParams();
    if (hocKyId !== undefined) params = params.set('hoc_ky_id', hocKyId);
    return this.http
      .get<{ data: CauHinhDiemApi }>(this.endpoint, { params })
      .pipe(map((response) => response.data));
  }

  layHocKy(): Observable<HocKyCauHinh[]> {
    return this.http
      .get<{ data: HocKyCauHinh[] }>(`${this.endpoint}/semesters`)
      .pipe(map((response) => response.data));
  }

  capNhat(
    cauHinh: CauHinhDiem,
    hocKyId: number,
  ): Observable<CauHinhDiemApi> {
    return this.http
      .put<{ data: CauHinhDiemApi }>(this.endpoint, {
        ...cauHinh,
        hoc_ky_id: hocKyId,
      })
      .pipe(map((response) => response.data));
  }
}
