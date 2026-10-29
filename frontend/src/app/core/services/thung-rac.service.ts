import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface BanGhiThungRac {
  id: number;
  [key: string]: unknown;
  deleted_at: string;
  xoa_boi?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface PhanTrangThungRac {
  success: boolean;
  message: string;
  data: BanGhiThungRac[];
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

export interface ThungRacFilter {
  q?: string;
  deleted_tu?: string;
  deleted_den?: string;
  page?: number;
  per_page?: number;
}

export const CAC_LOAI_THUC_THE = [
  { ma: 'subjects', ten: 'Môn học' },
  { ma: 'students', ten: 'Sinh viên' },
  { ma: 'teachers', ten: 'Giảng viên' },
  { ma: 'admin-classes', ten: 'Lớp hành chính' },
  { ma: 'semesters', ten: 'Học kỳ' },
  { ma: 'rooms', ten: 'Phòng học' },
  { ma: 'sections', ten: 'Lớp học phần' },
  { ma: 'menus', ten: 'Menu' },
  { ma: 'users', ten: 'Người dùng' },
] as const;

export type LoaiThucThe = typeof CAC_LOAI_THUC_THE[number]['ma'];

@Injectable({ providedIn: 'root' })
export class ThungRacService {
  private readonly http = inject(HttpClient);
  private readonly goc = environment.apiBaseUrl;

  layDanhSach(loai: string, boLoc?: ThungRacFilter): Observable<PhanTrangThungRac> {
    let params = new HttpParams();
    if (boLoc?.q) params = params.set('q', boLoc.q);
    if (boLoc?.deleted_tu) params = params.set('deleted_tu', boLoc.deleted_tu);
    if (boLoc?.deleted_den) params = params.set('deleted_den', boLoc.deleted_den);
    if (boLoc?.page) params = params.set('page', boLoc.page.toString());
    if (boLoc?.per_page) params = params.set('per_page', boLoc.per_page.toString());

    return this.http.get<PhanTrangThungRac>(`${this.goc}/trash/${loai}`, { params });
  }

  khoiPhuc(loai: string, id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.goc}/trash/${loai}/${id}/restore`,
      {},
    );
  }
}

