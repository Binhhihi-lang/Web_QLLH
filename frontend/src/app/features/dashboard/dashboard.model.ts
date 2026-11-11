/**
 * Kiểu dữ liệu dashboard theo vai trò — chép từ JSON mẫu ở
 * `docs/04-api-contract.md` §14, không phải từ mock.
 *
 * Vì sao không để trong `core/mock`: đây là hợp đồng API thật. Mock chỉ dùng
 * khi `useMock = true`; nếu kiểu nằm trong mock thì lúc tắt mock, component
 * vẫn phải import từ thư mục giả — sai hướng phụ thuộc.
 *
 * `the_so_lieu` dùng CHUNG shape cho cả ba dashboard (hợp đồng ghi rõ), nên
 * một interface duy nhất ở đây; dashboard ADMIN đang import bản trùng lặp từ
 * mock (lỗi kiến trúc đã biết, chờ xử lý riêng).
 */

/** Khoá định danh thẻ số liệu — FE gắn icon + màu theo khoá, không theo thứ tự. */
export type KhoaTheSoLieu =
  | 'sinh_vien'
  | 'lop_hoc_phan'
  | 'dang_ky'
  | 'cho_dang_ky'
  | 'lop_phu_trach'
  | 'sinh_vien_phu_trach'
  | 'buoi_sap_toi'
  | 'buoi_chua_diem_danh'
  | 'hoc_phan'
  | 'tin_chi'
  | 'gpa_he_4'
  | 'chuyen_can';

export interface TheSoLieu {
  /** Khoá định danh — FE gắn icon và màu, không hiển thị. */
  khoa: string;
  label: string;
  /**
   * Số hiển thị. KHÔNG ép int: GPA `2.74` và phần trăm `90.7` là số thực,
   * cắt thành int sẽ ra "2" và "90" sai (hợp đồng §14).
   */
  gia_tri: number;
  don_vi: string | null;
  phu_chu: string;
  xu_huong: 'len' | 'xuong' | 'bang';
}

export interface HocKyTomTat {
  id: number;
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  trang_thai: 'UPCOMING' | 'REGISTERING' | 'ONGOING' | 'CLOSED';
}

// =====================================================================
// SCR-04 — Dashboard GIANG_VIEN
// =====================================================================

export interface LopPhuTrach {
  id: number;
  ma_lop_hp: string;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  /** Chuỗi hiển thị trực tiếp dạng "38/45", cùng quy ước dashboard ADMIN. */
  si_so: string;
  /** Tỷ lệ lấp đầy 0–100, dùng làm độ dài thanh tiến trình. */
  ty_le: number;
  /** null = lớp phục vụ mọi năm (BR-23). */
  nam_thu: number | null;
  trang_thai: 'OPEN' | 'CLOSED' | 'CANCELLED';
  da_chot_diem: boolean;
  /**
   * Điểm trung bình `diem_tong_ket` của các đăng ký ACTIVE trong lớp, thang 10.
   *
   * CHƯA CÓ trong `docs/04-api-contract.md` §14 (mục "Trường của TEACHER
   * response" chưa khai trường này) — đây là khoảng trống hợp đồng đã báo PM,
   * không phải FE tự chế. Khai `?` + `null` để màn hình chạy được cả khi
   * backend chưa trả: thiếu trường thì biểu đồ tự ẩn, không vỡ kiểu.
   * Khi backend bổ sung, chỉ cần bỏ dấu `?`.
   */
  diem_tb_lop?: number | null;
}

export interface PhongHocTomTat {
  id: number;
  ma_phong: string;
  ten_phong: string;
}

/** Buổi học trong 14 ngày tới của giảng viên. */
export interface BuoiSapToi {
  id: number;
  ngay_hoc: string;
  /** 2 = Thứ 2 … 7 = Thứ 7, 8 = Chủ nhật (quy ước Việt Nam). */
  thu: number;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  hinh_thuc: string;
  trang_thai: string;
  ma_lop_hp: string;
  ma_mon: string;
  ten_mon: string;
  phong_hoc: PhongHocTomTat | null;
}

/** Buổi đã qua nhưng chưa có bản ghi điểm danh nào. */
export interface BuoiChuaDiemDanh {
  id: number;
  ngay_hoc: string;
  thu: number;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  gio_ket_thuc: string;
  ma_lop_hp: string;
  ma_mon: string;
  ten_mon: string;
  /** Số đăng ký ACTIVE của lớp — MỘT con số, khác `si_so` dạng "38/45". */
  si_so_lop: number;
  so_ngay_tre: number;
  /** false → quá hạn sửa; bấm chỉ mở danh sách kèm thông báo, không vào form. */
  con_sua_duoc: boolean;
}

export type MucDoViec = 'cao' | 'trung_binh' | 'thap';

export interface ViecCanLam {
  loai: string;
  tieu_de: string;
  mo_ta: string;
  so_luong: number;
  /** Chỉ dùng để tô màu icon/badge — không phải trạng thái nghiệp vụ. */
  muc_do: MucDoViec;
  /** Backend trả sẵn; FE không tự dựng từ `loai`. */
  url: string;
}

export interface DashboardGiangVien {
  hoc_ky: HocKyTomTat | null;
  the_so_lieu: TheSoLieu[];
  lop_phu_trach: LopPhuTrach[];
  buoi_sap_toi: BuoiSapToi[];
  buoi_chua_diem_danh: BuoiChuaDiemDanh[];
  viec_can_lam: ViecCanLam[];
}

// =====================================================================
// SCR-05 — Dashboard SINH_VIEN
// =====================================================================

export interface GiangVienTomTat {
  id: number;
  ma_gv: string;
  ho_ten: string;
}

export interface HocPhanDaDangKy {
  dang_ky_hoc_phan_id: number;
  lop_hoc_phan_id: number;
  ma_lop_hp: string;
  ma_mon: string;
  ten_mon: string;
  so_tin_chi: number;
  giang_vien: GiangVienTomTat | null;
  /**
   * Phân số 0–1, 4 chữ số (KHÔNG phải %). null = chưa điểm danh buổi nào.
   * Khác `the_so_lieu[chuyen_can].gia_tri` (phần trăm 0–100).
   */
  ty_le_chuyen_can: number | null;
  diem_tong_ket: number | null;
  diem_chu: string | null;
  ket_qua: string | null;
}

export interface BuoiTrongTuan {
  id: number;
  ngay_hoc: string;
  thu: number;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  /** SCHEDULED / DONE / CANCELLED — không suy ra "đã điểm danh" từ đây. */
  trang_thai: string;
  hinh_thuc: string;
  ly_do_huy: string | null;
  ma_lop_hp: string;
  ma_mon: string;
  ten_mon: string;
  ma_phong: string | null;
  ten_phong: string | null;
}

export interface ThoiKhoaBieuTuan {
  /** Thứ 2 của tuần chứa hôm nay — backend tính, FE không gửi lên. */
  tu_ngay: string;
  den_ngay: string;
  cac_buoi: BuoiTrongTuan[];
}

export interface GpaHocKy {
  id: number;
  ma_hoc_ky: string;
  ten_hoc_ky: string;
  gpa_he_10: number | null;
  gpa_he_4: number | null;
  tong_tin_chi: number;
}

export interface GpaTichLuy {
  gpa_he_10: number | null;
  gpa_he_4: number | null;
  tong_tin_chi: number;
  tin_chi_dat: number;
  so_hoc_ky_da_tinh: number;
}

export interface GpaCaNhan {
  hoc_ky_hien_tai: GpaHocKy | null;
  tich_luy: GpaTichLuy;
}

export interface MonCanChuY {
  ma_mon: string;
  ten_mon: string;
  ty_le: number;
}

export interface ChuyenCan {
  /** Phân số 0–1, 4 chữ số. null = chưa có buổi nào được điểm danh. */
  ty_le: number | null;
  tong_buoi_da_diem_danh: number;
  /** Mẫu số thật của công thức (đã trừ có phép); 0 → `ty_le = null`. */
  mau_so: number;
  co_mat: number;
  di_muon: number;
  vang: number;
  co_phep: number;
  ty_le_thap_nhat: MonCanChuY | null;
}

export interface DashboardSinhVien {
  hoc_ky: HocKyTomTat | null;
  the_so_lieu: TheSoLieu[];
  hoc_phan_da_dang_ky: HocPhanDaDangKy[];
  thoi_khoa_bieu_tuan: ThoiKhoaBieuTuan;
  gpa: GpaCaNhan;
  chuyen_can: ChuyenCan;
}
