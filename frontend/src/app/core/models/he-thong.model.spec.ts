import { CauHinhDiem, kiemTraCauHinhDiem } from './he-thong.model';

const cauHinhHopLe: CauHinhDiem = {
  'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
  'diem.bang_quy_doi': [
    { tu: 8.5, den: 10, chu: 'A', he_4: 4, dat: true },
    { tu: 7, den: 8.49, chu: 'B', he_4: 3, dat: true },
    { tu: 5.5, den: 6.99, chu: 'C', he_4: 2, dat: true },
    { tu: 4, den: 5.49, chu: 'D', he_4: 1, dat: true },
    { tu: 0, den: 3.99, chu: 'F', he_4: 0, dat: false },
  ],
  'diem.diem_danh.sua_trong_so_ngay': 7,
};

describe('kiemTraCauHinhDiem', () => {
  it('accepts the seeded grading rules', () => {
    expect(kiemTraCauHinhDiem(cauHinhHopLe)).toEqual({});
  });

  it('requires the three grade weights to total one', () => {
    const result = kiemTraCauHinhDiem({
      ...cauHinhHopLe,
      'diem.trong_so': { chuyen_can: 0.2, giua_ky: 0.2, cuoi_ky: 0.2 },
    });

    expect(result['diem.trong_so']).toBeTruthy();
  });

  it('rejects gaps and overlaps in the grade conversion ranges', () => {
    const result = kiemTraCauHinhDiem({
      ...cauHinhHopLe,
      'diem.bang_quy_doi': [
        ...cauHinhHopLe['diem.bang_quy_doi'].slice(0, 4),
        { ...cauHinhHopLe['diem.bang_quy_doi'][4], den: 3.98 },
      ],
    });

    expect(result['diem.bang_quy_doi']).toBeTruthy();
  });

  it('requires a non-negative integer attendance edit window', () => {
    const result = kiemTraCauHinhDiem({
      ...cauHinhHopLe,
      'diem.diem_danh.sua_trong_so_ngay': 1.5,
    });

    expect(result['diem.diem_danh.sua_trong_so_ngay']).toBeTruthy();
  });
});
