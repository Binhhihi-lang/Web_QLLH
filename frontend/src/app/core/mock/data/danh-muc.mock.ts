import { GiangVien, HocKy, LopHanhChinh, LopHocPhan, MonHoc, SinhVien } from '@core/models/danh-muc.model';

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Đặng', 'Bùi'];
const DEM_NAM = ['Văn', 'Minh', 'Quốc', 'Hữu', 'Đức', 'Thành', 'Công', 'Tuấn'];
const DEM_NU = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Minh', 'Kim', 'Diệu', 'Ánh'];
const TEN_NAM = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khánh', 'Long', 'Nam', 'Phong', 'Sơn', 'Tùng', 'Vinh'];
const TEN_NU = ['Anh', 'Chi', 'Dung', 'Hà', 'Hằng', 'Linh', 'Mai', 'Nga', 'Oanh', 'Thảo', 'Trang', 'Yến'];

/**
 * Sinh dữ liệu giả có tính xác định (seeded), KHÔNG dùng Math.random.
 *
 * Vì sao: mock mà đổi dữ liệu mỗi lần tải trang thì không chụp màn hình được,
 * không so sánh được giữa hai lần chạy, và test sẽ flaky.
 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(20261024);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

export const LOP_HANH_CHINH_MOCK: LopHanhChinh[] = [
  { id: 1, ma_lop: 'CNTT-K65-01', ten_lop: 'Công nghệ thông tin K65 - Lớp 01', khoa_hoc: 'K65', nganh: 'CNTT', nam_nhap_hoc: 2023, si_so: 42, trang_thai: true },
  { id: 2, ma_lop: 'CNTT-K66-02', ten_lop: 'Công nghệ thông tin K66 - Lớp 02', khoa_hoc: 'K66', nganh: 'CNTT', nam_nhap_hoc: 2024, si_so: 38, trang_thai: true },
  { id: 3, ma_lop: 'KTPM-K66-03', ten_lop: 'Kỹ thuật phần mềm K66 - Lớp 03', khoa_hoc: 'K66', nganh: 'KTPM', nam_nhap_hoc: 2024, si_so: 45, trang_thai: true },
  { id: 4, ma_lop: 'HTTT-K67-04', ten_lop: 'Hệ thống thông tin K67 - Lớp 04', khoa_hoc: 'K67', nganh: 'HTTT', nam_nhap_hoc: 2025, si_so: 36, trang_thai: true },
  { id: 5, ma_lop: 'ATTT-K67-05', ten_lop: 'An toàn thông tin K67 - Lớp 05', khoa_hoc: 'K67', nganh: 'ATTT', nam_nhap_hoc: 2025, si_so: 40, trang_thai: true },
];

export const MON_HOC_MOCK: MonHoc[] = [
  { id: 1, ma_mon: 'INT2203', ten_mon: 'Lập trình hướng đối tượng', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 2, ma_mon: 'INT2204', ten_mon: 'Cơ sở dữ liệu', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 3, ma_mon: 'INT2207', ten_mon: 'Phân tích thiết kế hệ thống', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 4, ma_mon: 'INT2215', ten_mon: 'Lập trình web', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 5, ma_mon: 'MAT1093', ten_mon: 'Đại số tuyến tính', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 6, ma_mon: 'INT2211', ten_mon: 'Mạng máy tính', so_tin_chi: 3, mo_ta: null, trang_thai: true },
  { id: 7, ma_mon: 'INT3306', ten_mon: 'Phát triển ứng dụng di động', so_tin_chi: 3, mo_ta: null, trang_thai: false },
  { id: 8, ma_mon: 'INT3401', ten_mon: 'Trí tuệ nhân tạo', so_tin_chi: 3, mo_ta: null, trang_thai: true },
];

export const HOC_KY_MOCK: HocKy[] = [
  { id: 1, ma_hoc_ky: '2025-1', ten_hoc_ky: 'Học kỳ 1 năm học 2025-2026', nam_hoc: '2025-2026', ky_thu: 1, ngay_bat_dau: '2025-09-08', ngay_ket_thuc: '2026-01-16', mo_dang_ky_luc: '2025-08-11 08:00:00', dong_dang_ky_luc: '2025-09-05 17:00:00', trang_thai: 'CLOSED', dang_mo_dang_ky: false },
  { id: 2, ma_hoc_ky: '2025-2', ten_hoc_ky: 'Học kỳ 2 năm học 2025-2026', nam_hoc: '2025-2026', ky_thu: 2, ngay_bat_dau: '2026-01-26', ngay_ket_thuc: '2026-05-29', mo_dang_ky_luc: '2025-12-15 08:00:00', dong_dang_ky_luc: '2026-01-23 17:00:00', trang_thai: 'CLOSED', dang_mo_dang_ky: false },
  { id: 3, ma_hoc_ky: '2026-1', ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027', nam_hoc: '2026-2027', ky_thu: 1, ngay_bat_dau: '2026-09-07', ngay_ket_thuc: '2027-01-16', mo_dang_ky_luc: '2026-08-10 08:00:00', dong_dang_ky_luc: '2026-09-05 17:00:00', trang_thai: 'ONGOING', dang_mo_dang_ky: false },
  { id: 4, ma_hoc_ky: '2026-2', ten_hoc_ky: 'Học kỳ 2 năm học 2026-2027', nam_hoc: '2026-2027', ky_thu: 2, ngay_bat_dau: '2027-01-25', ngay_ket_thuc: '2027-05-28', mo_dang_ky_luc: '2027-01-04 08:00:00', dong_dang_ky_luc: '2027-01-22 17:00:00', trang_thai: 'UPCOMING', dang_mo_dang_ky: false },
];

const BO_MON = ['Khoa học máy tính', 'Công nghệ phần mềm', 'Hệ thống thông tin', 'An toàn thông tin'];

export const GIANG_VIEN_MOCK: GiangVien[] = Array.from({ length: 12 }, (_, i) => {
  const nu = rand() > 0.5;
  const ho = pick(HO);
  const dem = nu ? pick(DEM_NU) : pick(DEM_NAM);
  const ten = nu ? pick(TEN_NU) : pick(TEN_NAM);
  return {
    id: i + 1,
    ma_gv: `GV${String(i + 1).padStart(4, '0')}`,
    ho_ten: `${ho} ${dem} ${ten}`,
    email: `gv${String(i + 1).padStart(4, '0')}@university.edu.vn`,
    so_dien_thoai: `09${int(10000000, 99999999)}`,
    chuyen_mon: pick(BO_MON),
    trang_thai: true,
    avatar_url: null,
  };
});

export const SINH_VIEN_MOCK: SinhVien[] = Array.from({ length: 86 }, (_, i) => {
  const nu = rand() > 0.5;
  const ho = pick(HO);
  const dem = nu ? pick(DEM_NU) : pick(DEM_NAM);
  const ten = nu ? pick(TEN_NU) : pick(TEN_NAM);
  const lop = pick(LOP_HANH_CHINH_MOCK);
  const nam = int(2002, 2006);
  return {
    id: i + 1,
    ma_sv: `2${String(1000000 + i * 7).slice(0, 6)}`,
    ho_ten: `${ho} ${dem} ${ten}`,
    ngay_sinh: `${nam}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    gioi_tinh: nu ? false : true,
    email: `sv${String(i + 1).padStart(4, '0')}@student.edu.vn`,
    so_dien_thoai: rand() > 0.15 ? `09${int(10000000, 99999999)}` : null,
    dia_chi: rand() > 0.3 ? `${int(1, 200)} ${pick(['Nguyễn Trãi', 'Lê Lợi', 'Trần Duy Hưng', 'Cầu Giấy'])}, Hà Nội` : null,
    lop_hanh_chinh_id: lop.id,
    lop_hanh_chinh_ten: lop.ma_lop,
    trang_thai: rand() > 0.08,
    avatar_url: null,
  };
});

export const LOP_HOC_PHAN_MOCK: LopHocPhan[] = Array.from({ length: 34 }, (_, i) => {
  const mon = MON_HOC_MOCK[i % 7]; // bỏ môn INACTIVE cuối
  const hk = HOC_KY_MOCK[int(2, 3)];
  const gv = GIANG_VIEN_MOCK[i % GIANG_VIEN_MOCK.length];
  const toiDa = pick([30, 35, 40, 45, 50]);
  const hienTai = int(Math.floor(toiDa * 0.3), toiDa);
  return {
    id: i + 1,
    ma_lop_hp: `${mon.ma_mon}-${hk.ma_hoc_ky}-${String(i + 1).padStart(2, '0')}`,
    mon_hoc: { id: mon.id, ma_mon: mon.ma_mon, ten_mon: mon.ten_mon, so_tin_chi: mon.so_tin_chi },
    hoc_ky: { id: hk.id, ma_hoc_ky: hk.ma_hoc_ky, ten_hoc_ky: hk.ten_hoc_ky, nam_hoc: hk.nam_hoc, ky_thu: hk.ky_thu, trang_thai: hk.trang_thai },
    giang_vien: { id: gv.id, ma_gv: gv.ma_gv, ho_ten: gv.ho_ten },
    si_so_toi_da: toiDa,
    si_so_hien_tai: hienTai,
    // Cứ 5 lớp thì 1 lớp dành riêng một năm thứ, còn lại mọi năm (BR-23).
    nam_thu: (i + 1) % 5 === 0 ? ((i + 1) / 5) % 4 + 1 : null,
    trang_thai: hienTai >= toiDa ? 'CLOSED' : 'OPEN',
    da_chot_diem: false,
  };
});
