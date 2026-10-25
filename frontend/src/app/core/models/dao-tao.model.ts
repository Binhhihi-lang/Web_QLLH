/**
 * Model sinh theo docs/04-api-contract.md — tên field tiếng Việt không dấu (ADR-002).
 * Không đổi tên field cho "đẹp": Backend trả đúng những tên này.
 *
 * Quy ước giá trị:
 * - `trang_thai` của bản ghi đào tạo là BOOLEAN (true = đang hoạt động),
 *   khớp cột `boolean` trong DB. Chỉ `lop_hoc_phan.trang_thai` và
 *   `dang_ky_hoc_phan.trang_thai` mới dùng chuỗi enum.
 * - Đường dẫn API dùng tiếng Anh (`/api/students`), trường JSON dùng tiếng Việt.
 *   Hai quy ước này độc lập — xem docs/04-api-contract.md.
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
  trang_thai: boolean;
  /** Object lồng theo hợp đồng API, không phải cột phẳng. */
  lop_hanh_chinh: LopHanhChinhRutGon | null;
  avatar_url: string | null;
  da_xoa: boolean;
}

export interface LopHanhChinhRutGon {
  id: number;
  ma_lop: string;
  ten_lop: string;
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
  da_xoa: boolean;
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
  chot_diem_luc: string | null;
  da_xoa: boolean;
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
  da_xoa: boolean;
}

export interface MonHoc {
  id: number;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  mo_ta: string | null;
  trang_thai: boolean;
  da_xoa: boolean;
}

/**
 * Mục trong ô chọn (dropdown) — `/api/options/*`.
 * Trường hiển thị tên là `label`, khớp OptionController và docs/04-api-contract.md.
 */
export interface TuyChon<T = number> {
  id: T;
  label: string;
}

export interface TuyChonMonHoc extends TuyChon {
  so_tin_chi: number;
}

export interface TuyChonHocKy extends TuyChon {
  trang_thai: TrangThaiHocKy;
  nam_hoc: string;
  ky_thu: number;
}

export interface TuyChonPhongHoc extends TuyChon {
  suc_chua: number;
}

export interface TuyChonLopHanhChinh extends TuyChon {
  khoa_hoc: string | null;
  nganh: string | null;
}

export interface TuyChonLopHocPhan extends TuyChon {
  con_cho: number;
  nam_thu: number | null;
}

/**
 * Tham số chung của mọi endpoint danh sách — docs/04-api-contract.md §1.6.
 * `per_page` chỉ nhận 10, 25, 50, 100.
 */
export interface ThamSoDanhSach {
  page?: number;
  per_page?: 10 | 25 | 50 | 100;
  /** Tìm kiếm — tên là `q`, không phải `keyword`. */
  q?: string;
  /** Tên cột trong whitelist của từng resource. */
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
