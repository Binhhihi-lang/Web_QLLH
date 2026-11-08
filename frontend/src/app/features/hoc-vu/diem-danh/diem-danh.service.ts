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
  /** Buổi đã có ít nhất một dòng điểm danh — API sessions trả sẵn, không cần gọi thêm. */
  da_diem_danh: boolean;
  so_diem_danh: number;
}

/**
 * Hình dạng `GET /sessions/{id}/attendance`: `data` là MỘT OBJECT chứa
 * `buoi_hoc` và `danh_sach`, không phải mảng. Nhầm thành mảng thì
 * `rows.length` là `undefined` và mọi buổi bị coi là chưa điểm danh.
 */
export interface PhanHoiDiemDanh {
  buoi_hoc: {
    id: number;
    ngay_hoc: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    trang_thai: 'SCHEDULED' | 'DONE' | 'CANCELLED';
    ly_do_huy: string | null;
    co_the_sua: boolean;
    phong_hoc: { id: number; ma_phong: string; ten_phong: string } | null;
    lop_hoc_phan: {
      id: number;
      ma_lop_hp: string;
      ten_mon_hoc: string | null;
      hoc_ky: { id: number; ma_hoc_ky: string; trang_thai: string } | null;
    };
  };
  danh_sach: DongDiemDanh[];
}

/** `PUT /sessions/{id}/attendance` trả tóm tắt, KHÔNG trả lại danh sách dòng. */
export interface KetQuaLuuDiemDanh {
  buoi_hoc_id: number;
  so_luong: number;
  trang_thai_buoi_hoc: 'SCHEDULED' | 'DONE' | 'CANCELLED';
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

  /** Danh sách dòng điểm danh — bóc `data.danh_sach`, không lấy nguyên `data`. */
  layDiemDanh(buoiHocId: number): Observable<DongDiemDanh[]> {
    return this.http
      .get<{ data: PhanHoiDiemDanh }>(`${this.goc}/sessions/${buoiHocId}/attendance`)
      .pipe(map((response) => response.data.danh_sach ?? []));
  }

  luuDiemDanh(buoiHocId: number, diemDanh: DongDiemDanhInput[]): Observable<KetQuaLuuDiemDanh> {
    return this.http
      .put<{ data: KetQuaLuuDiemDanh }>(`${this.goc}/sessions/${buoiHocId}/attendance`, {
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
