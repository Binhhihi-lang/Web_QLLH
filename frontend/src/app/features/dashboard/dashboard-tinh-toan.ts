import { BadgeSac } from '@shared/ui/status-badge';
import { BuoiTrongTuan, ChuyenCan, TheSoLieu } from './dashboard.model';

/**
 * Logic thuần của ba dashboard — tách khỏi component để test được mà không
 * cần dựng DOM, và để ba màn dùng CHUNG một cách hiển thị.
 *
 * Quy ước quan trọng (docs/04-api-contract.md §14):
 * - Trường tên `ty_le` là PHÂN SỐ 0–1 → nhân 100 khi cần hiện phần trăm.
 * - `the_so_lieu[].gia_tri` là PHẦN TRĂM 0–100 khi có `don_vi: '%'` → KHÔNG
 *   nhân 100 thêm lần nữa.
 * - `null` nghĩa là "chưa có dữ liệu" (hiện `—`), khác `0` (đã đo và bằng 0).
 *   Nhầm hai giá trị này là hiển thị sai nghiệp vụ, nên mọi hàm dưới đây giữ
 *   nguyên sự khác biệt đó.
 */

/** Dấu gạch dài cho ô "chưa có dữ liệu" — cùng ký tự với pipe `ngayVn`. */
export const CHUA_CO = '—';

const dinhDangSo = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/**
 * Số theo cách viết tiếng Việt: `7028` → `7.028`, `90.7` → `90,7`.
 *
 * Vì sao không dùng `DecimalPipe`: app chưa đăng ký `LOCALE_ID` vi-VN, pipe
 * mặc định en-US sẽ ra `7,028` và `90.7` — sai quy ước.
 *
 * `null`/`undefined` → `—`; `0` vẫn hiện `0`.
 */
export function dinhDangSoHienThi(giaTri: number | null | undefined): string {
  if (giaTri === null || giaTri === undefined || Number.isNaN(giaTri)) return CHUA_CO;
  return dinhDangSo.format(giaTri);
}

/** Phân số 0–1 → phần trăm 0–100, làm tròn 1 chữ số. `null` giữ `null`. */
export function phanSoSangPhanTram(tyLe: number | null | undefined): number | null {
  if (tyLe === null || tyLe === undefined || Number.isNaN(tyLe)) return null;
  return Math.round(tyLe * 1000) / 10;
}

/** Phân số 0–1 → chuỗi phần trăm, ví dụ `0.907` → `90,7 %`. `null` → `—`. */
export function dinhDangTuPhanSo(tyLe: number | null | undefined): string {
  const phanTram = phanSoSangPhanTram(tyLe);
  if (phanTram === null) return CHUA_CO;
  return `${dinhDangSoHienThi(phanTram)} %`;
}

/**
 * Màu tỉ lệ chuyên cần — CHỈ để tô màu, không phải quy tắc cấm thi.
 * `< 80 %` → cảnh báo, `80–89,9 %` → thông tin, `≥ 90 %` → thành công.
 * `null` (chưa có buổi nào) → không tô màu.
 */
export function mauChuyenCan(tyLePhanSo: number | null | undefined): BadgeSac | null {
  const phanTram = phanSoSangPhanTram(tyLePhanSo);
  if (phanTram === null) return null;
  if (phanTram < 80) return 'warning';
  if (phanTram < 90) return 'info';
  return 'success';
}

export type SacThe = 'primary' | 'chart-1' | 'chart-2' | 'danger' | 'info';

/**
 * Màu icon + nền nhạt của thẻ số liệu, theo `khoa` chứ KHÔNG theo vị trí:
 * backend đổi thứ tự hay thêm thẻ mới thì màu vẫn đúng nghĩa.
 */
const SAC_THE: Record<string, SacThe> = {
  // ADMIN (SCR-03) — bốn màu đã chốt trong đặc tả
  sinh_vien: 'primary',
  lop_hoc_phan: 'chart-1',
  dang_ky: 'chart-2',
  cho_dang_ky: 'danger',
  // GIANG_VIEN (SCR-04)
  lop_phu_trach: 'primary',
  sinh_vien_phu_trach: 'chart-1',
  buoi_sap_toi: 'chart-2',
  buoi_chua_diem_danh: 'danger',
  // SINH_VIEN (SCR-05)
  hoc_phan: 'primary',
  tin_chi: 'chart-1',
  gpa_he_4: 'chart-2',
  chuyen_can: 'info',
};

const ICON_THE: Record<string, string> = {
  sinh_vien: 'school',
  lop_hoc_phan: 'class',
  dang_ky: 'how_to_reg',
  cho_dang_ky: 'event_seat',
  lop_phu_trach: 'class',
  sinh_vien_phu_trach: 'groups',
  buoi_sap_toi: 'event',
  buoi_chua_diem_danh: 'fact_check',
  hoc_phan: 'menu_book',
  tin_chi: 'school',
  gpa_he_4: 'workspace_premium',
  chuyen_can: 'fact_check',
};

export function sacTheSoLieu(khoa: string): SacThe {
  return SAC_THE[khoa] ?? 'primary';
}

export function iconTheSoLieu(khoa: string): string {
  return ICON_THE[khoa] ?? 'insights';
}

export function iconXuHuong(the: Pick<TheSoLieu, 'xu_huong'>): string {
  if (the.xu_huong === 'len') return 'trending_up';
  if (the.xu_huong === 'xuong') return 'trending_down';
  return 'remove';
}

/** Thứ trong tuần theo quy ước Việt Nam: 2–7 là Thứ 2–Thứ 7, 8 là Chủ nhật. */
export function nhanThu(thu: number): string {
  if (thu === 8) return 'Chủ nhật';
  if (thu >= 2 && thu <= 7) return `Thứ ${thu}`;
  return '';
}

/**
 * Thứ dạng NGẮN cho ô bảng dày (`T2` … `T7`, `CN`) — mockup dùng dạng này ở
 * cột "Ngày" để ngày tháng không bị đẩy sang dòng thứ hai trên màn hẹp.
 */
export function nhanThuNgan(thu: number): string {
  if (thu === 8) return 'CN';
  if (thu >= 2 && thu <= 7) return `T${thu}`;
  return '';
}

export function nhanHinhThuc(hinhThuc: string): string {
  const map: Record<string, string> = {
    LY_THUYET: 'Lý thuyết',
    THUC_HANH: 'Thực hành',
    TRUC_TUYEN: 'Trực tuyến',
  };
  return map[hinhThuc] ?? hinhThuc;
}

export function nhanTrangThaiBuoi(trangThai: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'Sắp diễn ra',
    DONE: 'Đã học',
    CANCELLED: 'Đã huỷ',
  };
  return map[trangThai] ?? trangThai;
}

export function mauTrangThaiBuoi(trangThai: string): BadgeSac {
  const map: Record<string, BadgeSac> = {
    SCHEDULED: 'info',
    DONE: 'success',
    CANCELLED: 'danger',
  };
  return map[trangThai] ?? 'neutral';
}

/** Một lát của biểu đồ tròn. `mau` là TÊN biến token, component tự giải mã. */
export interface LatBieuDo {
  nhan: string;
  gia_tri: number;
  mau: string;
}

/**
 * Doughnut cho dashboard ADMIN: chỉ vẽ kỳ HIỆN TẠI (phần tử cuối) theo hai lát
 * đã đăng ký / còn trống.
 *
 * Trả `null` khi mảng có < 2 phần tử (quy ước: một cột/lát duy nhất trông như
 * lỗi render) hoặc kỳ đó không có chỗ nào để so sánh.
 */
export function latLapDay(
  tyLeLapDay: Array<{ hoc_ky: string; tong_cho: number; da_dang_ky: number }>,
): LatBieuDo[] | null {
  if (tyLeLapDay.length < 2) return null;

  const ky = tyLeLapDay[tyLeLapDay.length - 1];
  if (!ky || ky.tong_cho <= 0) return null;

  const daDangKy = Math.min(Math.max(ky.da_dang_ky, 0), ky.tong_cho);
  const conTrong = ky.tong_cho - daDangKy;
  if (daDangKy === 0 && conTrong === 0) return null;

  return [
    { nhan: 'Đã đăng ký', gia_tri: daDangKy, mau: '--color-chart-1' },
    { nhan: 'Còn trống', gia_tri: conTrong, mau: '--color-chart-2' },
  ];
}

/**
 * Doughnut chuyên cần của SINH_VIÊN: 4 lát có mặt / đi muộn / vắng / có phép.
 *
 * Bốn con số này đếm trên cùng một mẫu số; `co_phep` nằm ngoài mẫu số của công
 * thức tỉ lệ (FR-11.05) nhưng vẫn là một phần của "đã điểm danh", nên vẫn vẽ.
 */
export function latChuyenCan(chuyenCan: ChuyenCan): LatBieuDo[] | null {
  const tong =
    chuyenCan.co_mat + chuyenCan.di_muon + chuyenCan.vang + chuyenCan.co_phep;
  if (tong <= 0) return null;

  return [
    { nhan: 'Có mặt', gia_tri: chuyenCan.co_mat, mau: '--color-success' },
    { nhan: 'Đi muộn', gia_tri: chuyenCan.di_muon, mau: '--color-warning' },
    { nhan: 'Vắng', gia_tri: chuyenCan.vang, mau: '--color-danger' },
    { nhan: 'Có phép', gia_tri: chuyenCan.co_phep, mau: '--color-info' },
  ];
}

export interface NgayTrongTuan {
  thu: number;
  nhan: string;
  buoi: BuoiTrongTuan[];
}

/**
 * Gom thời khoá biểu theo thứ, luôn trả đủ 7 ngày (Thứ 2 → Chủ nhật) để lưới
 * tuần không co giãn khác nhau tuần này với tuần khác.
 */
export function sapXepTuan(cacBuoi: BuoiTrongTuan[]): NgayTrongTuan[] {
  const ngay: NgayTrongTuan[] = [2, 3, 4, 5, 6, 7, 8].map((thu) => ({
    thu,
    nhan: nhanThu(thu),
    buoi: [],
  }));

  for (const buoi of cacBuoi) {
    const o = ngay.find((n) => n.thu === buoi.thu);
    if (o) o.buoi.push(buoi);
  }

  for (const o of ngay) {
    o.buoi.sort((a, b) => a.gio_bat_dau.localeCompare(b.gio_bat_dau));
  }

  return ngay;
}

/** Bốn màu cột của biểu đồ lấp đầy, luân phiên theo chỉ số cột. */
const MAU_COT = ['--color-chart-1', '--color-chart-2', '--color-primary', '--color-danger'];

export function mauCotBieuDo(chiSo: number): string {
  return `var(${MAU_COT[chiSo % MAU_COT.length]})`;
}

/** Tỷ lệ lấp đầy của một kỳ, 0–100. Mẫu số 0 → 0 (không chia cho 0). */
export function tyLeLapDayPhanTram(ky: { tong_cho: number; da_dang_ky: number }): number {
  if (ky.tong_cho <= 0) return 0;
  return Math.round((ky.da_dang_ky / ky.tong_cho) * 100);
}

// =====================================================================
// Thẻ số liệu — đếm số khi màn hiện ra
// =====================================================================

/** Thời lượng đếm mặc định, ms. Đủ chậm để thấy số chạy, đủ nhanh để không chờ. */
export const THOI_LUONG_DEM = 900;

/** Khoảng lệch giữa các thẻ, ms — thẻ sau vào nhịp thẻ trước. */
export const TRE_MOI_THE = 70;

/**
 * Số chữ số thập phân để hiển thị, lấy từ chính giá trị đích và chặn ở 2.
 *
 * `2.74` → 2, `90.7` → 1, `7028` → 0. Cần biết trước khi chạy animation để số
 * không nhảy bề rộng giữa các khung hình (`2` → `2,7` → `2,74`).
 */
export function soChuSoThapPhan(giaTri: number): number {
  if (!Number.isFinite(giaTri)) return 0;
  const phanLe = Math.abs(giaTri).toString().split('.')[1];
  return phanLe ? Math.min(2, phanLe.length) : 0;
}

/**
 * Định dạng số kiểu tiếng Việt với số lẻ CỐ ĐỊNH: `7028` → `7.028`,
 * `90.7` (1 lẻ) → `90,7`, `2.74` (2 lẻ) → `2,74`.
 *
 * Vì sao không dùng `DecimalPipe`: app chưa đăng ký `LOCALE_ID` vi-VN nên pipe
 * mặc định en-US ra `7,028` — sai quy ước.
 */
export function dinhDangDemSo(giaTri: number, soThapPhan: number): string {
  if (!Number.isFinite(giaTri)) return CHUA_CO;
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: soThapPhan,
    maximumFractionDigits: soThapPhan,
  }).format(giaTri);
}

/** easeOutCubic — vào nhanh, dừng êm. Nhận tiến độ 0–1, trả 0–1. */
export function easeOutCubic(tienDo: number): number {
  const t = Math.min(1, Math.max(0, tienDo));
  return 1 - Math.pow(1 - t, 3);
}

/** Giá trị hiển thị tại một thời điểm của animation. Đầu → `batDau`, cuối → `ketThuc`. */
export function giaTriDemSo(batDau: number, ketThuc: number, tienDo: number): number {
  return batDau + (ketThuc - batDau) * easeOutCubic(tienDo);
}

/**
 * Người dùng có bật "giảm chuyển động" không.
 *
 * Bật thì gán thẳng số cuối, không chạy animation: chuyển động là thứ gây khó
 * chịu với người bị rối loạn tiền đình, và họ đã nói rõ ý định bằng cài đặt hệ
 * điều hành. jsdom không có `matchMedia` nên phải kiểm kiểu trước.
 */
export function giamChuyenDong(): boolean {
  if (typeof matchMedia !== 'function') return false;
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// =====================================================================
// Biểu đồ cột điểm (thang 10)
// =====================================================================

/** Trần thang điểm — trục dọc CỐ ĐỊNH 0–10, không co theo dữ liệu. */
export const DIEM_TOI_DA = 10;

/** Vạch trục dọc: 10, 8, 6, 4, 2, 0 (từ trên xuống). */
export const VACH_TRUC_DIEM = [10, 8, 6, 4, 2, 0];

/** Một cột của biểu đồ: tên môn hiển thị dưới cột + điểm (null = chưa chấm). */
export interface CotDiemMon {
  nhan: string;
  /** Tên đầy đủ cho tooltip `title` khi `nhan` bị cắt. */
  ten_day_du: string;
  gia_tri: number | null;
}

/**
 * Chiều cao cột theo % của vùng vẽ (0–100), tính từ thang 0–10 CỐ ĐỊNH.
 *
 * Vì sao không chuẩn hoá theo điểm cao nhất của kỳ: trục tự co khiến 7,5 và 8,0
 * trông chênh như 5 và 9 — người đọc hiểu sai mức chênh. `null` → 0 (không vẽ
 * cột, chỉ hiện "—").
 */
export function chieuCaoCotDiem(diem: number | null | undefined): number {
  if (diem === null || diem === undefined || !Number.isFinite(diem)) return 0;
  return (Math.min(DIEM_TOI_DA, Math.max(0, diem)) / DIEM_TOI_DA) * 100;
}

/** Nhãn số trên đầu cột: `8.5` → `8,5`, chưa chấm → `—`. */
export function nhanDiemTrenCot(diem: number | null | undefined): string {
  if (diem === null || diem === undefined || !Number.isFinite(diem)) return CHUA_CO;
  return dinhDangSoHienThi(diem);
}

export interface ToaDoDiem {
  /** Phần trăm theo chiều ngang, tâm cột. */
  x: number;
  /** Phần trăm theo chiều dọc, 0 = đỉnh vùng vẽ (điểm 10). */
  y: number;
}

/**
 * Toạ độ tâm cột thứ `i` trong `tong` cột trên vùng vẽ 100×100 (đơn vị %).
 *
 * Dùng % chứ không pixel để đường và cột luôn khớp nhau dù khối bị co giãn
 * theo bề rộng màn hình hay cuộn ngang.
 */
export function toaDoDiemCuaCot(
  i: number,
  tong: number,
  diem: number | null | undefined,
): ToaDoDiem | null {
  if (tong <= 0 || diem === null || diem === undefined || !Number.isFinite(diem)) return null;
  return {
    x: ((i + 0.5) / tong) * 100,
    y: 100 - chieuCaoCotDiem(diem),
  };
}

/**
 * Các đoạn thẳng của đường trung bình, mỗi đoạn là danh sách điểm nối.
 *
 * Môn chưa có điểm trung bình (`null`) CẮT đường: nối tắt qua chỗ trống sẽ vẽ
 * ra một giá trị không tồn tại ở môn đó. Trả mảng rỗng khi không đủ hai điểm
 * liên tiếp để vẽ.
 */
export function doanDuongTrungBinh(ds: Array<number | null | undefined>): ToaDoDiem[][] {
  const doan: ToaDoDiem[][] = [];
  let hienTai: ToaDoDiem[] = [];

  ds.forEach((diem, i) => {
    const toaDo = toaDoDiemCuaCot(i, ds.length, diem);
    if (toaDo) {
      hienTai.push(toaDo);
      return;
    }
    if (hienTai.length > 1) doan.push(hienTai);
    hienTai = [];
  });

  if (hienTai.length > 1) doan.push(hienTai);
  return doan;
}

/** Chuỗi `points` cho `<polyline>` của SVG, ví dụ `"12.5,20 37.5,28"`. */
export function chuoiDiemSvg(diem: ToaDoDiem[]): string {
  return diem.map((d) => `${d.x.toFixed(2)},${d.y.toFixed(2)}`).join(' ');
}

/** Mô tả cho trình đọc màn hình — biểu đồ canvas/SVG không tự đọc được số. */
export function moTaBieuDoCot(cot: CotDiemMon[]): string {
  if (cot.length === 0) return 'Biểu đồ điểm: chưa có dữ liệu.';
  const phan = cot.map((c) =>
    c.gia_tri === null ? `${c.nhan}: chưa có điểm` : `${c.nhan}: ${nhanDiemTrenCot(c.gia_tri)} trên 10`,
  );
  return `Biểu đồ điểm thang 10. ${phan.join('; ')}.`;
}

// =====================================================================
// Màu khối ca học — cùng bộ token với lịch tuần SCR-35
// =====================================================================

/**
 * Lớp màu của một khối ca học, theo `hinh_thuc` và trạng thái.
 *
 * Dùng CHUNG token `--lich-*` với lịch tuần (`features/hoc-vu/lich-hoc/tuan.ts`):
 * cùng một môn không thể xanh lá ở lịch tuần lại tím ở dashboard. Buổi đã huỷ
 * thắng mọi lớp khác — đỏ là tín hiệu người dùng cần thấy trước tiên.
 */
export function lopCaHoc(hinhThuc: string, trangThai: string): string {
  if (trangThai === 'CANCELLED') return 'tam-ngung';
  switch (hinhThuc) {
    case 'THUC_HANH':
      return 'thuc-hanh';
    case 'TRUC_TUYEN':
      return 'truc-tuyen';
    default:
      return 'ly-thuyet';
  }
}

