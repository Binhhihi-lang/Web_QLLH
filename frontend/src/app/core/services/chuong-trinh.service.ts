import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { MonHocRutGon, ThamSoDanhSach } from '@core/models/dao-tao.model';
import { PaginatedResponse } from '@core/mock/mock-response';
import { environment } from '@env/environment';

/**
 * Chương trình đào tạo — một ngành × một khóa (ADR-016 bổ sung 2026-11-13).
 *
 * Một môn trong chương trình là một DÒNG của bảng `chuong_trinh_mon`, không
 * phải bản ghi `mon_hoc`: cùng một môn có thể nằm ở chương trình K67 kỳ 3 và
 * chương trình K68 kỳ 4 với loại khác nhau. Vì vậy mọi thao tác sửa/xóa môn
 * đều nhận `id` của dòng, không nhận `mon_hoc.id`.
 */

export interface KhoaTrongChuongTrinh {
  id: number;
  ma_khoa: string;
  ten_khoa: string;
}

export interface NganhTrongChuongTrinh {
  id: number;
  ma_nganh: string;
  ten_nganh: string;
  khoa: KhoaTrongChuongTrinh | null;
}

export interface ChuongTrinhMon {
  /** `id` dòng `chuong_trinh_mon` — dùng cho PUT/DELETE môn. */
  id: number;
  /** 1–10; null = chưa gán kỳ, sinh viên không thấy môn này khi đăng ký. */
  ky_thu: number | null;
  /** true = bắt buộc, false = tự chọn. */
  bat_buoc: boolean;
  mon_hoc: MonHocRutGon;
}

export interface ChuongTrinhDaoTao {
  id: number;
  ma_ctdt: string;
  nganh: NganhTrongChuongTrinh | null;
  khoa_hoc: string;
  ma_lop_hanh_chinh_goi_y?: string | null;
  ten: string;
  so_nam?: number;
  so_ky?: number;
  mo_ta: string | null;
  trang_thai: boolean;
  so_mon: number;
  tong_tin_chi: number;
  /** Số môn chưa gán kỳ thứ — màn chi tiết cảnh báo khi > 0. */
  so_mon_chua_gan_ky: number;
  sinh_vien_ap_dung: number;
  /** Chỉ có ở `GET /curriculums/{id}` — danh sách không trả để nhẹ payload. */
  mon?: ChuongTrinhMon[];
}

export interface ChuongTrinhInput {
  ma_ctdt: string;
  nganh_id: number;
  khoa_hoc: string;
  ten: string;
  so_nam?: number;
  so_ky?: number;
  mo_ta?: string | null;
  trang_thai?: boolean;
}

export interface BoLocChuongTrinh extends ThamSoDanhSach {
  nganh_id?: number;
  khoa_hoc?: string;
  trang_thai?: boolean;
}

export interface KyTrongChuongTrinh {
  ky_thu: number | null;
  so_mon: number;
  tong_tin_chi: number;
  mon: ChuongTrinhMon[];
}

export interface ThemMonVaoChuongTrinhInput {
  mon_hoc_ids: number[];
  ky_thu?: number | null;
  bat_buoc?: boolean;
}

export interface CapNhatMonTrongChuongTrinhInput {
  ky_thu: number | null;
  bat_buoc: boolean;
}

/** Một dòng CSV gửi lên `POST /curriculums/{id}/import`. */
export interface DongImportChuongTrinh {
  ma_mon: string;
  ky_thu?: number | null;
  bat_buoc?: boolean;
}

export interface KetQuaImportDong {
  ma_mon: string;
  ket_qua: 'THANH_CONG' | 'THAT_BAI';
  ma_loi?: string;
  message?: string;
}

/**
 * Kết quả import theo từng dòng.
 *
 * Hợp đồng chưa chốt shape của endpoint này; chọn đúng quy ước các endpoint
 * hàng loạt khác của dự án (`{thanh_cong, that_bai, chi_tiet}` — BR-31) để FE
 * và BE nói cùng một ngôn ngữ. `chuanHoaKetQuaImport` vẫn nhận được mảng dòng
 * thô, phòng khi backend trả thẳng mảng.
 */
export interface KetQuaImportChuongTrinh {
  thanh_cong: number;
  that_bai: number;
  chi_tiet: KetQuaImportDong[];
}

@Injectable({ providedIn: 'root' })
export class ChuongTrinhService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiBaseUrl;
  private readonly goc = `${this.api}/curriculums`;

  layDanhSach(boLoc: BoLocChuongTrinh): Observable<PaginatedResponse<ChuongTrinhDaoTao>> {
    return this.http.get<PaginatedResponse<ChuongTrinhDaoTao>>(this.goc, {
      params: this.taoParams(boLoc),
    });
  }

  layMot(id: number): Observable<ChuongTrinhDaoTao> {
    return this.http
      .get<{ data: ChuongTrinhDaoTao }>(`${this.goc}/${id}`)
      .pipe(map(({ data }) => data));
  }

  tao(input: ChuongTrinhInput): Observable<ChuongTrinhDaoTao> {
    return this.http
      .post<{ data: ChuongTrinhDaoTao }>(this.goc, input)
      .pipe(map(({ data }) => data));
  }

  capNhat(id: number, input: ChuongTrinhInput): Observable<ChuongTrinhDaoTao> {
    return this.http
      .put<{ data: ChuongTrinhDaoTao }>(`${this.goc}/${id}`, input)
      .pipe(map(({ data }) => data));
  }

  xoa(id: number): Observable<void> {
    return this.http.delete(`${this.goc}/${id}`).pipe(map(() => undefined));
  }

  /** Thêm một lô môn; `ky_thu` / `bat_buoc` áp cho cả lô. */
  themMon(id: number, input: ThemMonVaoChuongTrinhInput): Observable<ChuongTrinhDaoTao> {
    return this.http
      .post<{ data: ChuongTrinhDaoTao }>(`${this.goc}/${id}/subjects`, input)
      .pipe(map(({ data }) => data));
  }

  capNhatMon(
    id: number,
    monId: number,
    input: CapNhatMonTrongChuongTrinhInput,
  ): Observable<ChuongTrinhDaoTao> {
    return this.http
      .put<{ data: ChuongTrinhDaoTao }>(`${this.goc}/${id}/subjects/${monId}`, input)
      .pipe(map(({ data }) => data));
  }

  xoaMon(id: number, monId: number): Observable<void> {
    return this.http.delete(`${this.goc}/${id}/subjects/${monId}`).pipe(map(() => undefined));
  }

  importCsv(id: number, rows: DongImportChuongTrinh[]): Observable<KetQuaImportChuongTrinh> {
    return this.http
      .post<{ data: KetQuaImportChuongTrinh | KetQuaImportDong[] }>(`${this.goc}/${id}/import`, {
        rows,
      })
      .pipe(map(({ data }) => this.chuanHoaKetQuaImport(data)));
  }

  /**
   * Chương trình của chính sinh viên đang đăng nhập.
   *
   * Trả `null` khi sinh viên chưa được gán chương trình (hoặc tài khoản chưa
   * xếp lớp): backend trả 404, và đó là trạng thái bình thường của dữ liệu chứ
   * không phải lỗi mạng — màn hình phải hiện "chưa có chương trình", không
   * phải "không tải được dữ liệu".
   */
  layCuaToi(): Observable<ChuongTrinhDaoTao | null> {
    // Backend trả `{ chuong_trinh, ky }`: `ky` là mảng nhóm theo kỳ thứ, mỗi phần
    // tử có `{ky_thu, mon[], so_mon, tong_tin_chi}`. Màn đăng ký chỉ cần danh sách
    // môn phẳng kèm `ky_thu`, nên làm phẳng ở đây — một chỗ duy nhất, không rải
    // việc chuyển đổi ra từng component.
    return this.http
      .get<{ data: { chuong_trinh: ChuongTrinhDaoTao | null; ky?: KyTrongChuongTrinh[] } | null }>(
        `${this.api}/me/curriculum`,
      )
      .pipe(
        map(({ data }) => {
          const ct = data?.chuong_trinh ?? null;
          if (ct === null) return null;

          const mon = (data?.ky ?? []).flatMap((nhom) =>
            (nhom.mon ?? []).map((m) => ({ ...m, ky_thu: m.ky_thu ?? nhom.ky_thu })),
          );

          return { ...ct, mon };
        }),
        catchError((loi: unknown) => {
          if (loi instanceof HttpErrorResponse && loi.status === 404) return of(null);
          throw loi;
        }),
      );
  }

  /** Chuẩn hoá kết quả import: nhận cả dạng tổng hợp lẫn mảng dòng thô. */
  private chuanHoaKetQuaImport(
    data: KetQuaImportChuongTrinh | KetQuaImportDong[],
  ): KetQuaImportChuongTrinh {
    if (!Array.isArray(data)) return data;

    const chiTiet = data;
    return {
      thanh_cong: chiTiet.filter((d) => d.ket_qua === 'THANH_CONG').length,
      that_bai: chiTiet.filter((d) => d.ket_qua === 'THAT_BAI').length,
      chi_tiet: chiTiet,
    };
  }

  private taoParams(input: object): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }
}
