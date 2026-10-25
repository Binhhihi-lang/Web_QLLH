import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SinhVien, ThamSoDanhSach, TuyChonLopHanhChinh } from '@core/models/dao-tao.model';
import { KetQuaHangLoat, PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

/**
 * Service danh sách sinh viên — KHUÔN MẪU cho mọi màn danh sách khác.
 *
 * Hai điều đáng chép sang màn khác:
 *
 * 1. Service trả `PaginatedResponse<SinhVien>` (có `meta` + `links`), không trả
 *    mảng trần. Màn hình cần `meta` để vẽ phân trang mà không phải tự đếm.
 *
 * 2. Tham số đi thẳng vào `HttpParams` với tên đúng hợp đồng (`q`, `sort_by`,
 *    `sort_dir`, `per_page`) — không đổi tên ở tầng service. Nếu đổi tên ở đây
 *    thì mock và backend thật sẽ nhận hai bộ tham số khác nhau.
 */
@Injectable({ providedIn: 'root' })
export class SinhVienService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(
    thamSo: ThamSoDanhSach & {
      lop_hanh_chinh_id?: number;
      khoa_hoc?: string;
      gioi_tinh?: boolean;
      trang_thai?: boolean;
      ngay_sinh_tu?: string;
      ngay_sinh_den?: string;
    },
  ): Observable<PaginatedResponse<SinhVien>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(thamSo)) {
      if (v === null || v === undefined || v === '') continue;
      params = params.set(k, String(v));
    }
    return this.http.get<PaginatedResponse<SinhVien>>(`${this.goc}/students`, { params });
  }

  /** Danh sách lớp cho ô lọc — trả `{id, label}` như mọi endpoint `/options/*`. */
  layTuyChonLop(): Observable<TuyChonLopHanhChinh[]> {
    return this.http
      .get<{ data: TuyChonLopHanhChinh[] }>(`${this.goc}/options/admin-classes`)
      .pipe(map((r) => r.data));
  }

  layMot(id: number): Observable<SinhVien> {
    return this.http
      .get<{ data: SinhVien }>(`${this.goc}/students/${id}`)
      .pipe(map((r) => r.data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.goc}/students/${id}`);
  }

  /**
   * Đổi trạng thái nhiều sinh viên một lần (BR-31).
   *
   * Hợp đồng dùng `PATCH` cho `bulk-status` và `POST` cho `bulk-delete` —
   * không đối xứng nhưng phải theo `docs/04-api-contract.md` mục 5.
   *
   * Backend xử lý từng dòng độc lập và LUÔN trả 200, kể cả khi mọi dòng lỗi —
   * nên không dựa vào `error` để biết kết quả, phải đọc `chi_tiet`.
   */
  doiTrangThaiHangLoat(ids: number[], trangThai: boolean): Observable<KetQuaHangLoat> {
    return this.http
      .patch<{ data: KetQuaHangLoat }>(`${this.goc}/students/bulk-status`, {
        ids,
        trang_thai: trangThai,
      })
      .pipe(map((r) => r.data));
  }

  xoaHangLoat(ids: number[]): Observable<KetQuaHangLoat> {
    return this.http
      .post<{ data: KetQuaHangLoat }>(`${this.goc}/students/bulk-delete`, { ids })
      .pipe(map((r) => r.data));
  }
}
