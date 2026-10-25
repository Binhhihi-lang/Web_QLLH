import { LopHocPhan } from '@core/models/dao-tao.model';
import { GIANG_VIEN_MOCK, HOC_KY_MOCK, MON_HOC_MOCK } from '@core/mock/data/dao-tao.mock';

/**
 * Dữ liệu giả nhóm HỌC VỤ — thuộc Đạt.
 *
 * Vì sao tách khỏi `dao-tao.mock.ts`: lớp học phần tham chiếu môn học, học kỳ và
 * giảng viên, nên nếu để chung một file thì Đạt phải sửa file của Đức Anh mỗi
 * lần thêm lớp giả. Ở đây chỉ ĐỌC ba mảng kia, không sửa — hình dạng của chúng
 * đã bị khoá bởi `dao-tao.model.ts` (PM sở hữu) và test.
 */

/** Sinh xác định, cùng công thức với `dao-tao.mock.ts` để dữ liệu ổn định giữa các lần chạy. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = seeded(20261025);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

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
    hoc_ky: {
      id: hk.id,
      ma_hoc_ky: hk.ma_hoc_ky,
      ten_hoc_ky: hk.ten_hoc_ky,
      nam_hoc: hk.nam_hoc,
      ky_thu: hk.ky_thu,
      trang_thai: hk.trang_thai,
    },
    giang_vien: { id: gv.id, ma_gv: gv.ma_gv, ho_ten: gv.ho_ten },
    si_so_toi_da: toiDa,
    si_so_hien_tai: hienTai,
    // Cứ 5 lớp thì 1 lớp dành riêng một năm thứ, còn lại mọi năm (BR-23).
    nam_thu: (i + 1) % 5 === 0 ? (((i + 1) / 5) % 4) + 1 : null,
    trang_thai: hienTai >= toiDa ? 'CLOSED' : 'OPEN',
    da_chot_diem: false,
    chot_diem_luc: null,
    da_xoa: false,
  };
});
