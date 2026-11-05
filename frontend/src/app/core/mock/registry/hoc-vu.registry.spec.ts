import { HttpParams } from '@angular/common/http';
import { HocVuRegistry } from './hoc-vu.registry';

describe('HocVuRegistry điểm', () => {
  let registry: HocVuRegistry;

  beforeEach(() => {
    registry = new HocVuRegistry();
  });

  it('returns student grade and GPA fixtures only for the student role', () => {
    const grades = registry.resolve('GET', '/me/grades', new HttpParams(), null, 'SINH_VIEN') as {
      data: { hoc_ky: { ma_hoc_ky: string }; mon_hoc: unknown[] };
    };
    const gpa = registry.resolve('GET', '/me/gpa', new HttpParams(), null, 'SINH_VIEN') as {
      data: { tich_luy: { gpa_he_4: number; tin_chi_dat: number } };
    };
    const forbidden = registry.resolve('GET', '/me/grades', new HttpParams(), null, 'ADMIN') as {
      success: boolean;
    };

    expect(grades.data.hoc_ky.ma_hoc_ky).toBeTruthy();
    expect(grades.data.mon_hoc.length).toBeGreaterThan(0);
    expect(gpa.data.tich_luy.gpa_he_4).toBe(2.87);
    expect(gpa.data.tich_luy.tin_chi_dat).toBe(88);
    expect(forbidden.success).toBe(false);
  });

  it('records grade changes and returns their history by enrollment', () => {
    const rows = registry.resolve(
      'GET',
      '/sections/1/grades',
      new HttpParams(),
    ) as { data: Array<{ dang_ky_hoc_phan_id: number; diem_chuyen_can: number }> };
    const first = rows.data[0];
    registry.resolve(
      'PUT',
      '/sections/1/grades',
      new HttpParams(),
      {
        ly_do: 'Điều chỉnh sau phúc khảo',
        diem: [
          {
            dang_ky_hoc_phan_id: first.dang_ky_hoc_phan_id,
            diem_chuyen_can: first.diem_chuyen_can + 0.5,
            diem_giua_ky: 6,
            diem_cuoi_ky: 6.5,
          },
        ],
      },
      'GIANG_VIEN',
    );
    const history = registry.resolve(
      'GET',
      `/enrollments/${first.dang_ky_hoc_phan_id}/grade-history`,
      new HttpParams(),
      null,
      'GIANG_VIEN',
    ) as { data: Array<{ truong: string; ly_do: string | null }> };

    expect(history.data).toHaveLength(1);
    expect(history.data[0]).toMatchObject({
      truong: 'diem_chuyen_can',
      ly_do: 'Điều chỉnh sau phúc khảo',
    });
  });
});
