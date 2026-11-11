import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GiangVien, GiangVienHoSo, ThamSoDanhSach, TuyChonNganh } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class GiangVienService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  /**
   * Danh sách giảng viên. Sinh viên nhận `GiangVienLienHeResource` (thiếu
   * `nganh`/`trang_thai`/`da_xoa`) — khai báo kiểu rộng để cả hai vai trò dùng
   * chung, nơi hiển thị phải chịu được trường vắng mặt.
   */
  layDanhSach(
    thamSo: ThamSoDanhSach & { chuyen_mon?: string; trang_thai?: boolean },
  ): Observable<PaginatedResponse<GiangVienHoSo>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(thamSo)) {
      if (v === null || v === undefined || v === '') continue;
      params = params.set(k, String(v));
    }
    return this.http.get<PaginatedResponse<GiangVienHoSo>>(`${this.goc}/teachers`, { params });
  }

  /**
   * Chi tiết đầy đủ — chỉ ADMIN và giảng viên xem hồ sơ chính mình mới nhận
   * được. Dùng ở form sửa và màn tài khoản cá nhân.
   */
  layMot(id: number): Observable<GiangVien> {
    return this.http.get<{ data: GiangVien }>(`${this.goc}/teachers/${id}`).pipe(map((r) => r.data));
  }

  /**
   * Khối liên hệ — dùng ở màn chi tiết vì sinh viên cũng vào được và chỉ nhận
   * `GiangVienLienHeResource`.
   */
  layMotLienHe(id: number): Observable<GiangVienHoSo> {
    return this.http
      .get<{ data: GiangVienHoSo }>(`${this.goc}/teachers/${id}`)
      .pipe(map((r) => r.data));
  }

  /** Ngành cho ô chọn ở form (ADR-020). */
  layTuyChonNganh(): Observable<TuyChonNganh[]> {
    return this.http
      .get<{ data: TuyChonNganh[] }>(`${this.goc}/options/nganh`)
      .pipe(map((r) => r.data));
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
  /** ADR-020: gắn ngành thay cho cột chuỗi `chuyen_mon` cũ. */
  nganh_id: number | null;
  trang_thai: boolean;
}

export interface GiangVienTaoMoi extends GiangVien {
  mat_khau_ban_dau: string;
}
