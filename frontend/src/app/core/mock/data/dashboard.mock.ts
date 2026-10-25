/**
 * Dữ liệu giả cho dashboard ADMIN (SCR-03).
 *
 * Số liệu ở đây là số ĐO ĐƯỢC từ dữ liệu giả của các module khác ở chỗ có thể
 * (tổng sinh viên, số lớp đang mở), chỉ những chỉ số backend phải tính bằng
 * truy vấn riêng (tỷ lệ lấp đầy, đăng ký gần đây) mới khai tĩnh.
 */

export interface TheSoLieu {
  /** Khoá định danh — dùng để gắn icon và màu, không hiển thị. */
  khoa: string;
  /** Nhãn hiển thị. Tên trường là `label`, khớp hợp đồng API. */
  label: string;
  gia_tri: number;
  don_vi: string | null;
  /** Mô tả phụ dưới con số, ví dụ "12 trong học kỳ này". */
  phu_chu: string;
  /** Chiều thay đổi so với kỳ trước. */
  xu_huong: 'len' | 'xuong' | 'bang';
}

export interface TyLeLapDay {
  hoc_ky: string;
  tong_cho: number;
  da_dang_ky: number;
}

export interface LopSapMo {
  id: number;
  ma_lop_hp: string;
  ten_mon_hoc: string;
  ten_giang_vien: string;
  /** Hiển thị dạng "38/45" cho cột sĩ số. */
  si_so: string;
  /** Tỷ lệ lấp đầy 0–100, để vẽ thanh tiến trình. */
  ty_le: number;
  trang_thai: 'OPEN' | 'CLOSED' | 'CANCELLED';
  /** null = lớp phục vụ mọi năm (BR-23). */
  nam_thu: number | null;
}

export interface DangKyGanDay {
  id: number;
  ma_sv: string;
  ho_ten: string;
  ma_lop_hp: string;
  ten_mon_hoc: string;
  thoi_gian: string;
  trang_thai: 'THANH_CONG' | 'DA_HUY';
}

export interface DashboardAdmin {
  the_so_lieu: TheSoLieu[];
  ty_le_lap_day: TyLeLapDay[];
  lop_sap_mo: LopSapMo[];
  dang_ky_gan_day: DangKyGanDay[];
}

export const DASHBOARD_ADMIN_MOCK: DashboardAdmin = {
  the_so_lieu: [
    {
      khoa: 'sinh_vien',
      label: 'Tổng sinh viên',
      gia_tri: 501,
      don_vi: null,
      phu_chu: '12 sinh viên mới trong học kỳ này',
      xu_huong: 'len',
    },
    {
      khoa: 'lop_hoc_phan',
      label: 'Lớp học phần đang mở',
      gia_tri: 34,
      don_vi: null,
      phu_chu: '6 lớp đã đầy sĩ số',
      xu_huong: 'len',
    },
    {
      khoa: 'dang_ky',
      label: 'Lượt đăng ký học phần',
      gia_tri: 7028,
      don_vi: null,
      phu_chu: 'Trung bình 14.0 lớp mỗi sinh viên',
      xu_huong: 'len',
    },
    {
      khoa: 'cho_dang_ky',
      label: 'Chỗ còn trống',
      gia_tri: 214,
      don_vi: 'chỗ',
      phu_chu: 'Chiếm 14.2% tổng sức chứa',
      xu_huong: 'xuong',
    },
  ],

  ty_le_lap_day: [
    { hoc_ky: 'HK1 2024-2025', tong_cho: 1200, da_dang_ky: 1085 },
    { hoc_ky: 'HK2 2024-2025', tong_cho: 1240, da_dang_ky: 1102 },
    { hoc_ky: 'HK1 2025-2026', tong_cho: 1310, da_dang_ky: 1124 },
    { hoc_ky: 'HK2 2025-2026', tong_cho: 1360, da_dang_ky: 986 },
  ],

  lop_sap_mo: [
    {
      id: 31,
      ma_lop_hp: 'INT2215-HK2-2025-31',
      ten_mon_hoc: 'Lập trình web',
      ten_giang_vien: 'Nguyễn Văn An',
      si_so: '38/45',
      ty_le: 84,
      trang_thai: 'OPEN',
      nam_thu: 4,
    },
    {
      id: 32,
      ma_lop_hp: 'INT2204-HK2-2025-32',
      ten_mon_hoc: 'Cơ sở dữ liệu',
      ten_giang_vien: 'Trần Thị Ngọc Anh',
      si_so: '45/45',
      ty_le: 100,
      trang_thai: 'CLOSED',
      nam_thu: 2,
    },
    {
      id: 33,
      ma_lop_hp: 'INT3401-HK2-2025-33',
      ten_mon_hoc: 'Trí tuệ nhân tạo',
      ten_giang_vien: 'Lê Minh Cường',
      si_so: '22/40',
      ty_le: 55,
      trang_thai: 'OPEN',
      nam_thu: 4,
    },
    {
      id: 34,
      ma_lop_hp: 'INT2203-HK2-2025-34',
      ten_mon_hoc: 'Lập trình hướng đối tượng',
      ten_giang_vien: 'Phạm Thu Hà',
      si_so: '41/45',
      ty_le: 91,
      trang_thai: 'OPEN',
      nam_thu: 1,
    },
    {
      id: 35,
      ma_lop_hp: 'MAT1093-HK2-2025-35',
      ten_mon_hoc: 'Đại số tuyến tính',
      ten_giang_vien: 'Hoàng Đức Long',
      si_so: '12/50',
      ty_le: 24,
      trang_thai: 'OPEN',
      nam_thu: 1,
    },
  ],

  dang_ky_gan_day: [
    {
      id: 1,
      ma_sv: '2100001',
      ho_ten: 'Nguyễn Văn An',
      ma_lop_hp: 'INT2215-HK2-2025-31',
      ten_mon_hoc: 'Lập trình web',
      thoi_gian: '2026-10-24 09:15:00',
      trang_thai: 'THANH_CONG',
    },
    {
      id: 2,
      ma_sv: '2100008',
      ho_ten: 'Trần Thị Ngọc Anh',
      ma_lop_hp: 'INT2204-HK2-2025-32',
      ten_mon_hoc: 'Cơ sở dữ liệu',
      thoi_gian: '2026-10-24 09:08:00',
      trang_thai: 'THANH_CONG',
    },
    {
      id: 3,
      ma_sv: '2100015',
      ho_ten: 'Lê Minh Cường',
      ma_lop_hp: 'INT3401-HK2-2025-33',
      ten_mon_hoc: 'Trí tuệ nhân tạo',
      thoi_gian: '2026-10-24 08:52:00',
      trang_thai: 'THANH_CONG',
    },
    {
      id: 4,
      ma_sv: '2100022',
      ho_ten: 'Phạm Thu Hà',
      ma_lop_hp: 'INT2203-HK2-2025-34',
      ten_mon_hoc: 'Lập trình hướng đối tượng',
      thoi_gian: '2026-10-24 08:35:00',
      trang_thai: 'DA_HUY',
    },
    {
      id: 5,
      ma_sv: '2100029',
      ho_ten: 'Hoàng Đức Long',
      ma_lop_hp: 'MAT1093-HK2-2025-35',
      ten_mon_hoc: 'Đại số tuyến tính',
      thoi_gian: '2026-10-24 08:20:00',
      trang_thai: 'THANH_CONG',
    },
    {
      id: 6,
      ma_sv: '2100036',
      ho_ten: 'Vũ Thảo Mai',
      ma_lop_hp: 'INT2215-HK2-2025-31',
      ten_mon_hoc: 'Lập trình web',
      thoi_gian: '2026-10-24 07:40:00',
      trang_thai: 'THANH_CONG',
    },
  ],
};
