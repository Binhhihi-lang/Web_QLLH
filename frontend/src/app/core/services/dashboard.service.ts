import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@core/mock/mock-response';
import { DashboardAdmin } from '@core/mock/data/dashboard.mock';
import { environment } from '@env/environment';

/**
 * Service dashboard.
 *
 * Gọi HttpClient như bình thường — mock layer đứng ở interceptor nên service
 * không biết dữ liệu đang là giả hay thật. Tắt mock chỉ đổi cờ trong
 * environment, không sửa file này.
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
}
