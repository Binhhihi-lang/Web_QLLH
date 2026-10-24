/**
 * Model sinh theo docs/openapi.yaml — tên field tiếng Việt không dấu (ADR-002).
 * Không đổi tên field cho "đẹp": Backend trả đúng những tên này.
 */

export type TrangThaiHoatDong = 'ACTIVE' | 'INACTIVE';

export type GioiTinh = 'NAM' | 'NU' | 'KHAC';

export interface SinhVien {
  id: number;
  ma_sv: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: GioiTinh;
  email: string;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  lop_hanh_chinh_id: number | null;
  lop_hanh_chinh_ten: string | null;
  trang_thai: TrangThaiHoatDong;
  ngay_tao: string;
}

export interface LopHanhChinh {
  id: number;
  ma_lop: string;
  ten_lop: string;
  khoa_hoc: string;
  si_so: number;
  trang_thai: TrangThaiHoatDong;
}

export type TrangThaiLopHocPhan = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface LopHocPhan {
  id: number;
  ma_lop_hp: string;
  mon_hoc_id: number;
  ten_mon_hoc: string;
  hoc_ky_id: number;
  ten_hoc_ky: string;
  giang_vien_id: number;
  ten_giang_vien: string;
  si_so_toi_da: number;
  si_so_hien_tai: number;
  trang_thai: TrangThaiLopHocPhan;
}

export type TrangThaiHocKy = 'UPCOMING' | 'REGISTERING' | 'ONGOING' | 'CLOSED';

export interface HocKy {
  id: number;
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  nam_hoc: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: TrangThaiHocKy;
}

export interface GiangVien {
  id: number;
  ma_gv: string;
  ho_ten: string;
  hoc_vi: string;
  email: string;
  so_dien_thoai: string | null;
  bo_mon: string;
  trang_thai: TrangThaiHoatDong;
}

export interface MonHoc {
  id: number;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  so_tiet: number;
  trang_thai: TrangThaiHoatDong;
}
