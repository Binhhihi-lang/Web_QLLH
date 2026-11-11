import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/mock/mock-response';
import { DashboardAdmin } from '@core/mock/data/dashboard.mock';
import { DashboardGiangVien, DashboardSinhVien } from '@features/dashboard/dashboard.model';
import { environment } from '@env/environment';

/**
 * Service dashboard.
 *
 * Gọi HttpClient như bình thường — mock layer đứng ở interceptor nên service
 * không biết dữ liệu đang là giả hay thật. Tắt mock chỉ đổi cờ trong
 * environment, không sửa file này.
 *
 * Ba endpoint `/dashboard/admin|teacher|student` là ba endpoint RIÊNG, không
 * gọi chéo: endpoint của vai trò khác trả 403 nên "gọi cho chắc rồi bỏ qua
 * lỗi" sẽ tạo request đỏ trong console mỗi lần tải trang.
 *
 * `hoc_ky_id` là tham số TUỲ CHỌN trên cả ba (hợp đồng §14a): không truyền thì
 * backend tự chọn kỳ `ONGOING` người dùng có dữ liệu. FE không gửi giá trị
 * đoán — chỉ gửi khi người dùng đã chọn từ `/api/options/semesters`.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDashboardAdmin(): Observable<DashboardAdmin> {
    return this.http
      .get<ApiResponse<DashboardAdmin>>(`${this.goc}/dashboard/admin`)
      .pipe(map((r) => r.data));
  }

  /** SCR-04 — dành cho tài khoản `GIANG_VIEN`. */
  layDashboardGiangVien(hocKyId?: number): Observable<DashboardGiangVien> {
    return this.http
      .get<ApiResponse<DashboardGiangVien>>(`${this.goc}/dashboard/teacher`, {
        params: DashboardService.thamSoKy(hocKyId),
      })
      .pipe(map((r) => r.data));
  }

  /** SCR-05 — dành cho tài khoản `SINH_VIEN`. */
  layDashboardSinhVien(hocKyId?: number): Observable<DashboardSinhVien> {
    return this.http
      .get<ApiResponse<DashboardSinhVien>>(`${this.goc}/dashboard/student`, {
        params: DashboardService.thamSoKy(hocKyId),
      })
      .pipe(map((r) => r.data));
  }

  /** Chỉ thêm `hoc_ky_id` khi có giá trị — query rỗng khác "không truyền". */
  private static thamSoKy(hocKyId?: number): HttpParams {
    return hocKyId ? new HttpParams().set('hoc_ky_id', hocKyId) : new HttpParams();
  }
}
