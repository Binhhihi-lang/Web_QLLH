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
  { id: 1, ma_lop: 'CNTT-K20A', ten_lop: 'Công nghệ thông tin K20A', khoa_hoc: 'K20', si_so: 42, trang_thai: 'ACTIVE' },
  { id: 2, ma_lop: 'CNTT-K20B', ten_lop: 'Công nghệ thông tin K20B', khoa_hoc: 'K20', si_so: 38, trang_thai: 'ACTIVE' },
  { id: 3, ma_lop: 'KTPM-K21A', ten_lop: 'Kỹ thuật phần mềm K21A', khoa_hoc: 'K21', si_so: 45, trang_thai: 'ACTIVE' },
  { id: 4, ma_lop: 'HTTT-K21A', ten_lop: 'Hệ thống thông tin K21A', khoa_hoc: 'K21', si_so: 36, trang_thai: 'ACTIVE' },
  { id: 5, ma_lop: 'ATTT-K22A', ten_lop: 'An toàn thông tin K22A', khoa_hoc: 'K22', si_so: 40, trang_thai: 'ACTIVE' },
];

export const MON_HOC_MOCK: MonHoc[] = [
  { id: 1, ma_mon: 'INT2203', ten_mon: 'Lập trình hướng đối tượng', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 2, ma_mon: 'INT2204', ten_mon: 'Cơ sở dữ liệu', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 3, ma_mon: 'INT2207', ten_mon: 'Phân tích thiết kế hệ thống', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 4, ma_mon: 'INT2215', ten_mon: 'Lập trình web', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 5, ma_mon: 'MAT1093', ten_mon: 'Đại số tuyến tính', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 6, ma_mon: 'INT2211', ten_mon: 'Mạng máy tính', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
  { id: 7, ma_mon: 'INT3306', ten_mon: 'Phát triển ứng dụng di động', so_tin_chi: 3, so_tiet: 45, trang_thai: 'INACTIVE' },
  { id: 8, ma_mon: 'INT3401', ten_mon: 'Trí tuệ nhân tạo', so_tin_chi: 3, so_tiet: 45, trang_thai: 'ACTIVE' },
];

export const HOC_KY_MOCK: HocKy[] = [
  { id: 1, ma_hoc_ky: 'HK1-2024', ten_hoc_ky: 'Học kỳ 1', nam_hoc: '2024-2025', ngay_bat_dau: '2024-09-05', ngay_ket_thuc: '2025-01-15', trang_thai: 'CLOSED' },
  { id: 2, ma_hoc_ky: 'HK2-2024', ten_hoc_ky: 'Học kỳ 2', nam_hoc: '2024-2025', ngay_bat_dau: '2025-01-20', ngay_ket_thuc: '2025-05-30', trang_thai: 'CLOSED' },
  { id: 3, ma_hoc_ky: 'HK1-2025', ten_hoc_ky: 'Học kỳ 1', nam_hoc: '2025-2026', ngay_bat_dau: '2025-09-08', ngay_ket_thuc: '2026-01-16', trang_thai: 'ONGOING' },
  { id: 4, ma_hoc_ky: 'HK2-2025', ten_hoc_ky: 'Học kỳ 2', nam_hoc: '2025-2026', ngay_bat_dau: '2026-01-26', ngay_ket_thuc: '2026-05-29', trang_thai: 'REGISTERING' },
  { id: 5, ma_hoc_ky: 'HK1-2026', ten_hoc_ky: 'Học kỳ 1', nam_hoc: '2026-2027', ngay_bat_dau: '2026-09-07', ngay_ket_thuc: '2027-01-15', trang_thai: 'UPCOMING' },
];

const BO_MON = ['Khoa học máy tính', 'Công nghệ phần mềm', 'Hệ thống thông tin', 'An toàn thông tin'];
const HOC_VI = ['ThS.', 'TS.', 'PGS.TS.', 'GS.TS.'];

export const GIANG_VIEN_MOCK: GiangVien[] = Array.from({ length: 12 }, (_, i) => {
  const nu = rand() > 0.5;
  const ho = pick(HO);
  const dem = nu ? pick(DEM_NU) : pick(DEM_NAM);
  const ten = nu ? pick(TEN_NU) : pick(TEN_NAM);
  return {
    id: i + 1,
    ma_gv: `GV${String(i + 1).padStart(4, '0')}`,
    ho_ten: `${ho} ${dem} ${ten}`,
    hoc_vi: pick(HOC_VI),
    email: `gv${String(i + 1).padStart(4, '0')}@university.edu.vn`,
    so_dien_thoai: `09${int(10000000, 99999999)}`,
    bo_mon: pick(BO_MON),
    trang_thai: 'ACTIVE' as const,
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
    gioi_tinh: nu ? 'NU' : 'NAM',
    email: `sv${String(i + 1).padStart(4, '0')}@student.edu.vn`,
    so_dien_thoai: rand() > 0.15 ? `09${int(10000000, 99999999)}` : null,
    dia_chi: rand() > 0.3 ? `${int(1, 200)} ${pick(['Nguyễn Trãi', 'Lê Lợi', 'Trần Duy Hưng', 'Cầu Giấy'])}, Hà Nội` : null,
    lop_hanh_chinh_id: lop.id,
    lop_hanh_chinh_ten: lop.ma_lop,
    trang_thai: rand() > 0.08 ? 'ACTIVE' : 'INACTIVE',
    ngay_tao: `2025-0${int(1, 9)}-${String(int(1, 28)).padStart(2, '0')}`,
  };
});

export const LOP_HOC_PHAN_MOCK: LopHocPhan[] = Array.from({ length: 34 }, (_, i) => {
  const mon = MON_HOC_MOCK[i % 7]; // bỏ môn INACTIVE cuối
  const hk = HOC_KY_MOCK[int(2, 4)];
  const gv = GIANG_VIEN_MOCK[i % GIANG_VIEN_MOCK.length];
  const toiDa = pick([30, 35, 40, 45, 50]);
  const hienTai = int(Math.floor(toiDa * 0.3), toiDa);
  return {
    id: i + 1,
    ma_lop_hp: `${mon.ma_mon}-${hk.ma_hoc_ky}-${String(i + 1).padStart(2, '0')}`,
    mon_hoc_id: mon.id,
    ten_mon_hoc: mon.ten_mon,
    hoc_ky_id: hk.id,
    ten_hoc_ky: `${hk.ten_hoc_ky} ${hk.nam_hoc}`,
    giang_vien_id: gv.id,
    ten_giang_vien: gv.ho_ten,
    si_so_toi_da: toiDa,
    si_so_hien_tai: hienTai,
    trang_thai: hienTai >= toiDa ? 'CLOSED' : 'OPEN',
  };
});
