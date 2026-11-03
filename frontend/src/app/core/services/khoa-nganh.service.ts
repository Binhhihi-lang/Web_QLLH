import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Khoa,
  Nganh,
  ThamSoDanhSach,
  TuyChonKhoa,
  TuyChonNganh,
} from '@core/models/dao-tao.model';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export interface KhoaInput {
  ma_khoa: string;
  ten_khoa: string;
  mo_ta: string | null;
  trang_thai: boolean;
}

export interface NganhInput {
  khoa_id: number;
  ma_nganh: string;
  ten_nganh: string;
  mo_ta: string | null;
  trang_thai: boolean;
}

export interface ThamSoDanhSachKhoa extends ThamSoDanhSach {
  trang_thai?: boolean;
}

export interface ThamSoDanhSachNganh extends ThamSoDanhSach {
  khoa_id?: number;
  trang_thai?: boolean;
}

@Injectable({ providedIn: 'root' })
export class KhoaNganhService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSachKhoa(thamSo: ThamSoDanhSachKhoa): Observable<PaginatedResponse<Khoa>> {
    return this.http.get<PaginatedResponse<Khoa>>(`${this.goc}/khoa`, {
      params: this.taoParams(thamSo),
    });
  }

  layKhoa(id: number): Observable<Khoa> {
    return this.http
      .get<{ data: Khoa }>(`${this.goc}/khoa/${id}`)
      .pipe(map(({ data }) => data));
  }

  taoKhoa(input: KhoaInput): Observable<Khoa> {
    return this.http
      .post<{ data: Khoa }>(`${this.goc}/khoa`, input)
      .pipe(map(({ data }) => data));
  }

  capNhatKhoa(id: number, input: KhoaInput): Observable<Khoa> {
    return this.http
      .put<{ data: Khoa }>(`${this.goc}/khoa/${id}`, input)
      .pipe(map(({ data }) => data));
  }

  xoaKhoa(id: number): Observable<void> {
    return this.http.delete(`${this.goc}/khoa/${id}`).pipe(map(() => undefined));
  }

  layDanhSachNganh(thamSo: ThamSoDanhSachNganh): Observable<PaginatedResponse<Nganh>> {
    return this.http.get<PaginatedResponse<Nganh>>(`${this.goc}/nganh`, {
      params: this.taoParams(thamSo),
    });
  }

  layNganh(id: number): Observable<Nganh> {
    return this.http
      .get<{ data: Nganh }>(`${this.goc}/nganh/${id}`)
      .pipe(map(({ data }) => data));
  }

  taoNganh(input: NganhInput): Observable<Nganh> {
    return this.http
      .post<{ data: Nganh }>(`${this.goc}/nganh`, input)
      .pipe(map(({ data }) => data));
  }

  capNhatNganh(id: number, input: NganhInput): Observable<Nganh> {
    return this.http
      .put<{ data: Nganh }>(`${this.goc}/nganh/${id}`, input)
      .pipe(map(({ data }) => data));
  }

  xoaNganh(id: number): Observable<void> {
    return this.http.delete(`${this.goc}/nganh/${id}`).pipe(map(() => undefined));
  }

  layTuyChonKhoa(): Observable<TuyChonKhoa[]> {
    return this.http
      .get<{ data: TuyChonKhoa[] }>(`${this.goc}/options/khoa`)
      .pipe(map(({ data }) => data));
  }

  layTuyChonNganh(khoaId?: number): Observable<TuyChonNganh[]> {
    const params = khoaId === undefined ? undefined : new HttpParams().set('khoa_id', khoaId);
    return this.http
      .get<{ data: TuyChonNganh[] }>(`${this.goc}/options/nganh`, { params })
      .pipe(map(({ data }) => data));
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
