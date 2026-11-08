import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Hình thức học của một buổi. Là DANH MỤC (không phải trạng thái): quyết định
 * màu khối trên lịch tuần — lý thuyết xám, thực hành xanh lá, trực tuyến xanh
 * dương. Backend có thể chưa trả field này (đang bổ sung); nơi đọc phải chịu
 * được `undefined` và coi như `LY_THUYET`.
 */
export type HinhThucHoc = 'LY_THUYET' | 'THUC_HANH' | 'TRUC_TUYEN';

export interface BuoiHoc {
  id: number;
  lop_hoc_phan_id: number;
  ngay_hoc: string;
  tiet_bat_dau: number | null;
  tiet_ket_thuc: number | null;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'SCHEDULED' | 'DONE' | 'CANCELLED';
  hinh_thuc?: HinhThucHoc;
  ly_do_huy: string | null;
  buoi_goc_id: number | null;
  phong_hoc: { id: number; ma_phong: string; ten_phong: string } | null;
  da_diem_danh: boolean;
  so_diem_danh: number;
}

export interface DongLich {
  thu: number;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong_hoc_id: number;
}

export interface YeuCauSinhLich {
  thu: number[];
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong_hoc_id: number;
  tu_ngay: string;
  den_ngay: string;
}

@Injectable({ providedIn: 'root' })
export class BuoiHocService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layCuaLop(lopId: number): Observable<BuoiHoc[]> {
    return this.http
      .get<{ data: BuoiHoc[] }>(`${this.goc}/sections/${lopId}/sessions`)
      .pipe(map((r) => r.data));
  }

  sinhLich(lopId: number, yeuCau: YeuCauSinhLich): Observable<BuoiHoc[]> {
    return this.http
      .post<{ data: BuoiHoc[] }>(`${this.goc}/sections/${lopId}/sessions/generate`, yeuCau)
      .pipe(map((r) => r.data));
  }

  themBuoi(
    lopId: number,
    yeuCau: {
      ngay_hoc: string;
      tiet_bat_dau: number;
      tiet_ket_thuc: number;
      phong_hoc_id: number;
      hinh_thuc?: HinhThucHoc;
      buoi_goc_id?: number | null;
    },
  ): Observable<BuoiHoc> {
    return this.http
      .post<{ data: BuoiHoc }>(`${this.goc}/sections/${lopId}/sessions`, yeuCau)
      .pipe(map((r) => r.data));
  }

  suaBuoi(
    id: number,
    yeuCau: {
      ngay_hoc: string;
      tiet_bat_dau: number;
      tiet_ket_thuc: number;
      phong_hoc_id: number;
      hinh_thuc?: HinhThucHoc;
      xac_nhan?: boolean;
    },
  ): Observable<BuoiHoc> {
    return this.http
      .put<{ data: BuoiHoc }>(`${this.goc}/sessions/${id}`, yeuCau)
      .pipe(map((r) => r.data));
  }

  doiTrangThai(
    id: number,
    trang_thai: 'CANCELLED' | 'SCHEDULED',
    tuyChon: { ly_do_huy?: string; xac_nhan?: boolean } = {},
  ): Observable<BuoiHoc> {
    return this.http
      .patch<{ data: BuoiHoc }>(`${this.goc}/sessions/${id}/status`, { trang_thai, ...tuyChon })
      .pipe(map((r) => r.data));
  }

  xoaBuoi(id: number, xacNhan = false): Observable<void> {
    return this.http
      .delete<{ data: null }>(`${this.goc}/sessions/${id}`, { body: { xac_nhan: xacNhan } })
      .pipe(map(() => undefined));
  }
}
