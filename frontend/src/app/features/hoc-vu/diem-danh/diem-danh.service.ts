import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SinhVienLop } from '@core/services/lop-hoc-phan.service';
import { environment } from '@env/environment';

export type TrangThaiDiemDanh = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export interface BuoiHocDiemDanh {
  id: number;
  ngay_hoc: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: 'SCHEDULED' | 'DONE' | 'CANCELLED';
}

export interface DongDiemDanh {
  dang_ky_hoc_phan_id: number;
  sinh_vien: SinhVienLop;
  trang_thai: TrangThaiDiemDanh | null;
  ghi_chu: string | null;
}

export interface DongDiemDanhInput {
  dang_ky_hoc_phan_id: number;
  trang_thai: TrangThaiDiemDanh;
  ghi_chu: string | null;
}

export interface ThongKeChuyenCan {
  lop_hoc_phan_id: number;
  ma_lop_hp: string;
  tong_buoi: number;
  sinh_vien: Array<{
    dang_ky_hoc_phan_id: number;
    sinh_vien: SinhVienLop;
    co_mat: number;
    di_muon: number;
    vang: number;
    co_phep: number;
    ty_le: number | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DiemDanhService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layBuoiTheoLop(lopHocPhanId: number): Observable<BuoiHocDiemDanh[]> {
    return this.http
      .get<{ data: BuoiHocDiemDanh[] }>(`${this.goc}/sections/${lopHocPhanId}/sessions`)
      .pipe(map((response) => response.data));
  }

  layDiemDanh(buoiHocId: number): Observable<DongDiemDanh[]> {
    return this.http
      .get<{ data: DongDiemDanh[] }>(`${this.goc}/sessions/${buoiHocId}/attendance`)
      .pipe(map((response) => response.data));
  }

  luuDiemDanh(buoiHocId: number, diemDanh: DongDiemDanhInput[]): Observable<DongDiemDanh[]> {
    return this.http
      .put<{ data: DongDiemDanh[] }>(`${this.goc}/sessions/${buoiHocId}/attendance`, {
        diem_danh: diemDanh,
      })
      .pipe(map((response) => response.data));
  }

  layThongKe(lopHocPhanId: number): Observable<ThongKeChuyenCan> {
    return this.http
      .get<{ data: ThongKeChuyenCan }>(`${this.goc}/sections/${lopHocPhanId}/attendance-summary`)
      .pipe(map((response) => response.data));
  }
}
