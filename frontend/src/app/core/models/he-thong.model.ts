export interface TrongSoDiem {
  chuyen_can: number;
  giua_ky: number;
  cuoi_ky: number;
}

export interface KhoangQuyDoiDiem {
  tu: number;
  den: number;
  chu: 'A' | 'B' | 'C' | 'D' | 'F';
  he_4: number;
  dat: boolean;
}

export interface CauHinhDiem {
  'diem.trong_so': TrongSoDiem;
  'diem.bang_quy_doi': KhoangQuyDoiDiem[];
  'diem.diem_danh.sua_trong_so_ngay': number;
}

export function laTrongSoDiem(value: unknown): value is TrongSoDiem {
  if (value === null || typeof value !== 'object') return false;
  const weights = value as Record<string, unknown>;
  return ['chuyen_can', 'giua_ky', 'cuoi_ky'].every((key) => typeof weights[key] === 'number');
}

export function laKhoangQuyDoiDiem(value: unknown): value is KhoangQuyDoiDiem {
  if (value === null || typeof value !== 'object') return false;
  const range = value as Record<string, unknown>;
  return (
    typeof range['tu'] === 'number' &&
    typeof range['den'] === 'number' &&
    ['A', 'B', 'C', 'D', 'F'].includes(String(range['chu'])) &&
    typeof range['he_4'] === 'number' &&
    typeof range['dat'] === 'boolean'
  );
}

export function kiemTraCauHinhDiem(cauHinh: CauHinhDiem): Record<string, string> {
  const loi: Record<string, string> = {};
  const trongSo = cauHinh['diem.trong_so'];
  const cacTrongSo = [trongSo.chuyen_can, trongSo.giua_ky, trongSo.cuoi_ky];

  if (
    cacTrongSo.some((value) => !Number.isFinite(value) || value < 0 || value > 1) ||
    Math.abs(cacTrongSo.reduce((total, value) => total + value, 0) - 1) > 0.00001
  ) {
    loi['diem.trong_so'] = 'Ba trọng số phải nằm trong khoảng 0–1 và có tổng bằng 1.';
  }

  const bang = cauHinh['diem.bang_quy_doi'];
  const sapXep = [...bang].sort((a, b) => a.tu - b.tu);
  const khoangTheoCent = sapXep.map((range) => ({
    tu: Math.round(range.tu * 100),
    den: Math.round(range.den * 100),
  }));
  const hopLeTungKhoang = sapXep.every(
    (range) =>
      Number.isFinite(range.tu) &&
      Number.isFinite(range.den) &&
      Number.isFinite(range.he_4) &&
      range.tu >= 0 &&
      range.den <= 10 &&
      range.tu <= range.den &&
      Number.isInteger(range.tu * 100) &&
      Number.isInteger(range.den * 100) &&
      range.he_4 >= 0 &&
      range.he_4 <= 4 &&
      ['A', 'B', 'C', 'D', 'F'].includes(range.chu) &&
      typeof range.dat === 'boolean',
  );
  const lienTuc =
    khoangTheoCent.length > 0 &&
    khoangTheoCent[0].tu === 0 &&
    khoangTheoCent[khoangTheoCent.length - 1].den === 1000 &&
    khoangTheoCent.every(
      (range, index) => index === 0 || range.tu === khoangTheoCent[index - 1].den + 1,
    );
  if (!hopLeTungKhoang || !lienTuc) {
    loi['diem.bang_quy_doi'] =
      'Các khoảng phải hợp lệ, dùng tối đa hai chữ số thập phân và phủ liên tục từ 0 đến 10.';
  }

  const soNgay = cauHinh['diem.diem_danh.sua_trong_so_ngay'];
  if (!Number.isInteger(soNgay) || soNgay < 0) {
    loi['diem.diem_danh.sua_trong_so_ngay'] = 'Số ngày phải là số nguyên không âm.';
  }
  return loi;
}
