import { HttpParams } from '@angular/common/http';

/**
 * Envelope API của QLLH — khớp docs/04-api-contract.md.
 *
 * Khác với dự án đặt vé máy bay: bên đó dùng `{code, message, data}` với mã
 * lỗi là SỐ. QLLH dùng `success` boolean và `ma_loi` là CHUỖI
 * (`SECTION_FULL`, `GRADE_LOCKED`…), nên không thể tái dùng helper cũ.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PageLinks {
  first: string | null;
  prev: string | null;
  next: string | null;
  last: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PageMeta;
  links: PageLinks;
}

/** Kết quả một dòng trong thao tác hàng loạt — BR-31. */
export interface KetQuaDong {
  id: number;
  ket_qua: 'THANH_CONG' | 'THAT_BAI';
  ma_loi?: string;
  message?: string;
}

/**
 * Kết quả endpoint thao tác hàng loạt. Backend luôn trả 200 và xử lý từng dòng
 * độc lập, nên KHÔNG dùng HTTP status để biết thành công — phải đọc `that_bai`
 * hoặc `chi_tiet`.
 */
export interface KetQuaHangLoat {
  thanh_cong: number;
  that_bai: number;
  chi_tiet: KetQuaDong[];
}

/** Mã lỗi nghiệp vụ — xem bảng ánh xạ ở docs/05-screens.md mục 6. */
export const MaLoi = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SECTION_FULL: 'SECTION_FULL',
  DUPLICATE_ENROLLMENT: 'DUPLICATE_ENROLLMENT',
  DUPLICATE_SUBJECT_IN_SEMESTER: 'DUPLICATE_SUBJECT_IN_SEMESTER',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  OUTSIDE_REGISTRATION: 'OUTSIDE_REGISTRATION',
  GRADE_LOCKED: 'GRADE_LOCKED',
  SEMESTER_CLOSED: 'SEMESTER_CLOSED',
  DELETE_BLOCKED: 'DELETE_BLOCKED',
  MUST_CHANGE_PASSWORD: 'MUST_CHANGE_PASSWORD',
} as const;

export type MaLoiValue = (typeof MaLoi)[keyof typeof MaLoi];

/** HTTP status tương ứng từng mã lỗi — giống Backend thật. */
export function statusFor(maLoi: string): number {
  switch (maLoi) {
    case MaLoi.UNAUTHENTICATED:
      return 401;
    case MaLoi.FORBIDDEN:
    case MaLoi.MUST_CHANGE_PASSWORD:
      return 403;
    case MaLoi.NOT_FOUND:
      return 404;
    case MaLoi.SECTION_FULL:
    case MaLoi.DUPLICATE_ENROLLMENT:
    case MaLoi.DUPLICATE_SUBJECT_IN_SEMESTER:
    case MaLoi.SCHEDULE_CONFLICT:
    case MaLoi.OUTSIDE_REGISTRATION:
    case MaLoi.GRADE_LOCKED:
    case MaLoi.SEMESTER_CLOSED:
    case MaLoi.DELETE_BLOCKED:
      return 409;
    case MaLoi.VALIDATION_ERROR:
      return 422;
    default:
      return 500;
  }
}

export function ok<T>(data: T, message = 'Thành công'): ApiResponse<T> {
  return { success: true, message, data };
}

export function loi(maLoi: string, message: string, errors: Record<string, string[]> | null = null) {
  return { success: false, message, ma_loi: maLoi, errors };
}

export function loiNghiepVu(maLoi: string, message: string) {
  return loi(maLoi, message);
}

export function loiValidation(errors: Record<string, string[]>) {
  return loi(MaLoi.VALIDATION_ERROR, 'Dữ liệu không hợp lệ.', errors);
}

/** Phân trang theo đúng shape `meta` + `links` của QLLH. */
export function paginate<T>(
  items: T[],
  params: HttpParams,
  baseUrl: string,
): PaginatedResponse<T> {
  const currentPage = Number(params.get('page') ?? 1) || 1;
  // Hợp đồng §1.6: `per_page` chỉ nhận 10, 25, 50, 100. Giá trị lạ rơi về 10.
  const xinPerPage = Number(params.get('per_page') ?? 10);
  const perPage = [10, 25, 50, 100].includes(xinPerPage) ? xinPerPage : 10;
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (currentPage - 1) * perPage;

  const link = (p: number | null) =>
    p === null ? null : `${baseUrl}?page=${p}&per_page=${perPage}`;

  return {
    success: true,
    message: 'Thành công',
    data: items.slice(start, start + perPage),
    meta: { current_page: currentPage, per_page: perPage, total, last_page: lastPage },
    links: {
      first: link(1),
      prev: currentPage > 1 ? link(currentPage - 1) : null,
      next: currentPage < lastPage ? link(currentPage + 1) : null,
      last: link(lastPage),
    },
  };
}

/** Đọc query param từ URL đầy đủ (interceptor nhận URL tuyệt đối). */
export function readParams(urlWithParams: string): HttpParams {
  const q = urlWithParams.indexOf('?');
  return new HttpParams({ fromString: q === -1 ? '' : urlWithParams.slice(q + 1) });
}

/** Bỏ phần gốc URL để so khớp với khai báo đường dẫn trong registry. */
export function stripOrigin(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '');
}

/**
 * Đọc giá trị theo đường dẫn có thể lồng nhau: `doc(row, 'mon_hoc.ten_mon')`.
 * Cần vì `LopHocPhan` trả object lồng (`mon_hoc`, `hoc_ky`, `giang_vien`)
 * đúng như hợp đồng API, không làm phẳng như bản mock trước.
 */
function doc(row: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, row);
}

/** Lọc theo `keyword` trên các trường văn bản. */
export function searchBy<T>(rows: T[], keyword: string | null, fields: string[]): T[] {
  if (!keyword) return rows;
  const k = keyword.toLowerCase();
  return rows.filter((row) =>
    fields.some((f) => String(doc(row, f) ?? '').toLowerCase().includes(k)),
  );
}

/**
 * Lọc chính xác theo các query param có trong danh sách cho phép.
 *
 * Query string luôn là chuỗi, nên phải đổi về đúng kiểu của giá trị trong dữ
 * liệu trước khi so sánh: `?trang_thai=false` phải khớp boolean `false`, và
 * `?gioi_tinh=1` phải khớp `true`. So sánh `String(false)` với `"0"` sẽ trượt.
 */
export function filterBy<T extends object>(
  rows: T[],
  params: HttpParams,
  allowed: string[],
): T[] {
  let result = rows;
  for (const field of allowed) {
    const raw = params.get(field);
    if (raw === null || raw === '') continue;

    result = result.filter((row) => {
      const value = doc(row, field);
      if (value === null || value === undefined) return false;
      if (typeof value === 'boolean') {
        return value === (raw === 'true' || raw === '1');
      }
      if (typeof value === 'number') {
        return value === Number(raw);
      }
      return String(value) === raw;
    });
  }
  return result;
}

/** Sắp xếp theo `sort_by` (tên cột) + `sort_dir` (asc/desc) — hợp đồng §1.6. */
export function sortBy<T extends object>(
  rows: T[],
  params: HttpParams,
  fallback: string,
): T[] {
  const field = params.get('sort_by') ?? fallback;
  const desc = params.get('sort_dir') === 'desc';
  return [...rows].sort((a, b) => {
    const av = doc(a, field);
    const bv = doc(b, field);
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    // Số so với số thì so theo số, còn lại so theo chuỗi (locale tiếng Việt).
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'vi');
    return desc ? -cmp : cmp;
  });
}
