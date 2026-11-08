import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PaginatedResponse } from '@core/mock/mock-response';
import { HinhThucHoc } from '@core/services/buoi-hoc.service';
import { environment } from '@env/environment';

export interface BuoiLich {
  id: number;
  ngay_hoc: string;
  tiet_bat_dau: number | null;
  tiet_ket_thuc: number | null;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'SCHEDULED' | 'DONE' | 'CANCELLED';
  /** Hình thức học — quyết định màu khối lịch tuần. Xem `HinhThucHoc`. */
  hinh_thuc?: HinhThucHoc;
  ly_do_huy: string | null;
  buoi_goc_id: number | null;
  lop_hoc_phan: { id: number; ma_lop_hp: string };
  mon_hoc: { id: number; ma_mon: string; ten_mon: string } | null;
  hoc_ky: { id: number; ma_hoc_ky: string; ten_hoc_ky: string } | null;
  giang_vien: { id: number; ma_gv: string; ho_ten: string; da_xoa: boolean } | null;
  phong_hoc: { id: number; ma_phong: string; ten_phong: string; da_xoa: boolean } | null;
}

export interface BoLocLich {
  hoc_ky_id?: number;
  giang_vien_id?: number;
  phong_hoc_id?: number;
  tu_ngay?: string;
  den_ngay?: string;
  trang_thai?: string;
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class LichHocService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(boLoc: BoLocLich): Observable<PaginatedResponse<BuoiLich>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(boLoc)) {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    }
    return this.http.get<PaginatedResponse<BuoiLich>>(`${this.goc}/schedules`, { params });
  }

  /** Lấy hết các trang trong khoảng tuần đang xem — lịch tuần cần đủ buổi. */
  layTatCa(boLoc: BoLocLich): Observable<BuoiLich[]> {
    return this.layDanhSach({ ...boLoc, per_page: 100 }).pipe(
      map((trang) => trang.data),
    );
  }
}
