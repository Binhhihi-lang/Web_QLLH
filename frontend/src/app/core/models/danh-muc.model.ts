/**
 * Model sinh theo docs/openapi.yaml — tên field tiếng Việt không dấu (ADR-002).
 * Không đổi tên field cho "đẹp": Backend trả đúng những tên này.
 *
 * Quy ước giá trị:
 * - `trang_thai` của bản ghi danh mục là BOOLEAN (true = đang hoạt động),
 *   khớp cột `boolean` trong DB. Chỉ `lop_hoc_phan.trang_thai` và
 *   `dang_ky_hoc_phan.trang_thai` mới dùng chuỗi enum.
 */

export type VaiTro = 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN';

/** `users.trang_thai` — false = tài khoản bị khóa (BR-02). */
export type TrangThaiTaiKhoan = boolean;

export type GioiTinh = boolean; // true = Nam, khớp cột boolean trong DB

export interface NguoiDung {
  id: number;
  name: string;
  email: string;
  /** URL Cloudinary; null = dùng ảnh mặc định chữ cái đầu. */
  avatar_url: string | null;
  vai_tro: VaiTro;
  trang_thai: boolean;
  must_change_password: boolean;
  ho_so: HoSoNguoiDung | null;
}

export interface HoSoNguoiDung {
  loai: 'sinh_vien' | 'giang_vien';
  id: number;
  ho_ten: string;
  ma_sv?: string;
  ma_gv?: string;
  lop_hanh_chinh_id?: number | null;
  chuyen_mon?: string | null;
}

export interface SinhVien {
  id: number;
  ma_sv: string;
  ho_ten: string;
  ngay_sinh: string | null;
  gioi_tinh: GioiTinh;
  email: string;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  lop_hanh_chinh_id: number | null;
  lop_hanh_chinh_ten: string | null;
  trang_thai: boolean;
  avatar_url: string | null;
}

export interface LopHanhChinh {
  id: number;
  ma_lop: string;
  ten_lop: string;
  /** Khóa (cohort), ví dụ K65 — KHÔNG phải khoa/faculty. Xem ADR-016. */
  khoa_hoc: string | null;
  nganh: string | null;
  /** Năm nhập học, dùng tính năm thứ (03-data-model.md §5.6). */
  nam_nhap_hoc: number | null;
  si_so: number;
  trang_thai: boolean;
}

export type TrangThaiLopHocPhan = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface LopHocPhan {
  id: number;
  ma_lop_hp: string;
  mon_hoc: MonHocRutGon;
  hoc_ky: HocKyRutGon;
  giang_vien: GiangVienRutGon;
  si_so_toi_da: number;
  si_so_hien_tai: number;
  /** null = lớp phục vụ mọi năm (BR-23). */
  nam_thu: number | null;
  trang_thai: TrangThaiLopHocPhan;
  da_chot_diem: boolean;
}

export interface MonHocRutGon {
  id: number;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
}

export interface HocKyRutGon {
  id: number;
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  nam_hoc: string;
  ky_thu: number;
  trang_thai: TrangThaiHocKy;
}

export interface GiangVienRutGon {
  id: number;
  ma_gv: string;
  ho_ten: string;
}

/** Vòng đời chỉ tiến, không có trạng thái "đang đăng ký" riêng (ADR-017). */
export type TrangThaiHocKy = 'UPCOMING' | 'ONGOING' | 'CLOSED';

export interface HocKy {
  id: number;
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  /** Ví dụ "2026-2027". */
  nam_hoc: string;
  /** 1, 2 hoặc 3 (học kỳ hè). */
  ky_thu: number;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  mo_dang_ky_luc: string;
  dong_dang_ky_luc: string;
  trang_thai: TrangThaiHocKy;
  dang_mo_dang_ky: boolean;
}

export interface GiangVien {
  id: number;
  ma_gv: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  chuyen_mon: string | null;
  trang_thai: boolean;
  avatar_url: string | null;
}

export interface MonHoc {
  id: number;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  mo_ta: string | null;
  trang_thai: boolean;
}
