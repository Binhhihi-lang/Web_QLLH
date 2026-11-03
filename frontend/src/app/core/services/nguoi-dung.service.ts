import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { NguoiDung, VaiTro } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

export type VaiTroNguoiDung = VaiTro;
export type NguoiDungQuanTri = NguoiDung;

export interface NguoiDungInput {
  name: string;
  email: string;
  vai_tro: VaiTroNguoiDung;
  trang_thai: boolean;
}

export interface NguoiDungTaoMoi extends NguoiDungQuanTri {
  mat_khau_ban_dau: string;
}

export interface NguoiDungDatLaiMatKhau extends NguoiDungQuanTri {
  mat_khau_moi: string;
}

export interface BoLocNguoiDung {
  page?: number;
  per_page?: number;
  q?: string;
  vai_tro?: VaiTroNguoiDung;
  trang_thai?: boolean;
  sort_by?: 'id' | 'name' | 'email' | 'vai_tro' | 'trang_thai';
  sort_dir?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class NguoiDungService {
  private readonly http = inject(HttpClient);
  private readonly goc = `${environment.apiBaseUrl}/users`;

  layDanhSach(boLoc: BoLocNguoiDung): Observable<PaginatedResponse<NguoiDungQuanTri>> {
    let params = new HttpParams();
    for (const [khoa, giaTri] of Object.entries(boLoc)) {
      if (giaTri !== undefined && giaTri !== null && giaTri !== '') {
        params = params.set(khoa, String(giaTri));
      }
    }

    return this.http.get<PaginatedResponse<NguoiDungQuanTri>>(this.goc, { params });
  }

  layMot(id: number): Observable<NguoiDungQuanTri> {
    return this.http
      .get<{ data: NguoiDungQuanTri }>(`${this.goc}/${id}`)
      .pipe(map((response) => response.data));
  }

  taoMoi(duLieu: NguoiDungInput): Observable<NguoiDungTaoMoi> {
    return this.http
      .post<{ data: NguoiDungTaoMoi }>(this.goc, duLieu)
      .pipe(map((response) => response.data));
  }

  capNhat(id: number, duLieu: NguoiDungInput): Observable<NguoiDungQuanTri> {
    return this.http
      .put<{ data: NguoiDungQuanTri }>(`${this.goc}/${id}`, duLieu)
      .pipe(map((response) => response.data));
  }

  doiTrangThai(id: number, trangThai: boolean): Observable<NguoiDungQuanTri> {
    return this.http
      .patch<{ data: NguoiDungQuanTri }>(`${this.goc}/${id}/status`, { trang_thai: trangThai })
      .pipe(map((response) => response.data));
  }

  doiTrangThaiHangLoat(ids: number[], trangThai: boolean): Observable<KetQuaHangLoat> {
    return this.http
      .patch<{ data: KetQuaHangLoat }>(`${this.goc}/bulk-status`, { ids, trang_thai: trangThai })
      .pipe(map((response) => response.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/${id}`);
  }

  datLaiMatKhau(id: number): Observable<NguoiDungDatLaiMatKhau> {
    return this.http
      .post<{ data: NguoiDungDatLaiMatKhau }>(`${this.goc}/${id}/reset-password`, {})
      .pipe(map((response) => response.data));
  }
}
