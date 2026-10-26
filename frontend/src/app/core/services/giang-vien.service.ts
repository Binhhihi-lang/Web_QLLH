import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GiangVien, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class GiangVienService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(
    thamSo: ThamSoDanhSach & { chuyen_mon?: string; trang_thai?: boolean },
  ): Observable<PaginatedResponse<GiangVien>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(thamSo)) {
      if (v === null || v === undefined || v === '') continue;
      params = params.set(k, String(v));
    }
    return this.http.get<PaginatedResponse<GiangVien>>(`${this.goc}/teachers`, { params });
  }

  layMot(id: number): Observable<GiangVien> {
    return this.http.get<{ data: GiangVien }>(`${this.goc}/teachers/${id}`).pipe(map((r) => r.data));
  }

  taoMoi(duLieu: GiangVienInput): Observable<GiangVienTaoMoi> {
    return this.http
      .post<{ data: GiangVienTaoMoi }>(`${this.goc}/teachers`, duLieu)
      .pipe(map((r) => r.data));
  }

  capNhat(id: number, duLieu: GiangVienInput): Observable<GiangVien> {
    return this.http
      .put<{ data: GiangVien }>(`${this.goc}/teachers/${id}`, duLieu)
      .pipe(map((r) => r.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/teachers/${id}`);
  }

  doiTrangThaiHangLoat(ids: number[], trangThai: boolean): Observable<KetQuaHangLoat> {
    return this.http
      .patch<{ data: KetQuaHangLoat }>(`${this.goc}/teachers/bulk-status`, {
        ids,
        trang_thai: trangThai,
      })
      .pipe(map((r) => r.data));
  }

  xoaHangLoat(ids: number[]): Observable<KetQuaHangLoat> {
    return this.http
      .post<{ data: KetQuaHangLoat }>(`${this.goc}/teachers/bulk-delete`, { ids })
      .pipe(map((r) => r.data));
  }
}

export interface GiangVienInput {
  ma_gv: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  chuyen_mon: string | null;
  trang_thai: boolean;
}

export interface GiangVienTaoMoi extends GiangVien {
  mat_khau_ban_dau: string;
}
