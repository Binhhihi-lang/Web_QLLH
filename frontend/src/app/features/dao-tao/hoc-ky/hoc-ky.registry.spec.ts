import { HttpParams } from '@angular/common/http';
import { DaoTaoRegistry } from '@core/mock/registry/dao-tao.registry';

describe('DaoTaoRegistry học kỳ', () => {
  let registry: DaoTaoRegistry;

  const goi = (method: string, path: string, body: unknown = null, params = new HttpParams()) =>
    registry.resolve(method, path, params, body) as {
      success: boolean;
      data: any;
      ma_loi?: string;
      errors?: Record<string, string[]>;
    };

  const hocKyMoi = {
    ma_hoc_ky: '2028-1',
    ten_hoc_ky: 'Học kỳ 1 năm học 2028-2029',
    nam_hoc: '2028-2029',
    ky_thu: 1,
    ngay_bat_dau: '2028-09-05',
    ngay_ket_thuc: '2029-01-15',
    mo_dang_ky_luc: '2028-09-06 08:00:00',
    dong_dang_ky_luc: '2028-09-08 17:00:00',
  };

  beforeEach(() => {
    registry = new DaoTaoRegistry();
  });

  it('filters, creates, reads, updates and soft-deletes an upcoming semester', () => {
    const filtered = goi(
      'GET',
      '/semesters',
      null,
      new HttpParams().set('q', '2026-1').set('per_page', '100'),
    );
    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0].ma_hoc_ky).toBe('2026-1');

    const created = goi('POST', '/semesters', hocKyMoi);
    expect(created.success).toBe(true);
    expect(created.data).toMatchObject({ ...hocKyMoi, trang_thai: 'UPCOMING' });
    expect(goi('GET', `/semesters/${created.data.id}`).data.ma_hoc_ky).toBe('2028-1');

    const updated = goi('PUT', `/semesters/${created.data.id}`, {
      ...hocKyMoi,
      ten_hoc_ky: 'Học kỳ đã cập nhật',
    });
    expect(updated.data.ten_hoc_ky).toBe('Học kỳ đã cập nhật');

    expect(goi('DELETE', `/semesters/${created.data.id}`).success).toBe(true);
    expect(goi('GET', `/semesters/${created.data.id}`).ma_loi).toBe('NOT_FOUND');
  });

  it('rejects duplicate year/term, invalid registration windows and overlapping dates', () => {
    const duplicateTerm = goi('POST', '/semesters', {
      ...hocKyMoi,
      nam_hoc: '2026-2027',
      ky_thu: 1,
      ma_hoc_ky: 'DUP-TERM',
    });
    expect(duplicateTerm.success).toBe(false);
    expect(duplicateTerm.errors?.['ky_thu']).toBeDefined();

    const invalidWindow = goi('POST', '/semesters', {
      ...hocKyMoi,
      ma_hoc_ky: 'INVALID-WINDOW',
      dong_dang_ky_luc: '2028-09-04 17:00:00',
    });
    expect(invalidWindow.success).toBe(false);
    expect(invalidWindow.errors?.['dong_dang_ky_luc']).toBeDefined();

    const overlap = goi('POST', '/semesters', {
      ...hocKyMoi,
      ma_hoc_ky: 'OVERLAP',
      ngay_bat_dau: '2026-10-01',
      ngay_ket_thuc: '2027-01-10',
      mo_dang_ky_luc: '2026-10-02 08:00:00',
      dong_dang_ky_luc: '2026-10-10 17:00:00',
    });
    expect(overlap.success).toBe(false);
    expect(overlap.ma_loi).toBe('SEMESTER_OVERLAP');
  });

  it('enforces forward-only status transitions and at most one ongoing semester', () => {
    expect(
      goi('PATCH', '/semesters/4/status', { trang_thai: 'CLOSED' }).ma_loi,
    ).toBe('SEMESTER_TRANSITION_INVALID');
    expect(
      goi('PATCH', '/semesters/4/status', { trang_thai: 'ONGOING' }).ma_loi,
    ).toBe('SEMESTER_TRANSITION_INVALID');

    expect(goi('PATCH', '/semesters/3/status', { trang_thai: 'CLOSED' }).success).toBe(true);
    expect(goi('PATCH', '/semesters/4/status', { trang_thai: 'ONGOING' }).data.trang_thai).toBe(
      'ONGOING',
    );
    expect(goi('PATCH', '/semesters/4/status', { trang_thai: 'CLOSED' }).data.trang_thai).toBe(
      'CLOSED',
    );
    expect(
      goi('PATCH', '/semesters/4/status', { trang_thai: 'ONGOING' }).ma_loi,
    ).toBe('SEMESTER_TRANSITION_INVALID');
  });

  it('blocks deletion unless the semester is upcoming and has no sections', () => {
    expect(goi('DELETE', '/semesters/3').ma_loi).toBe('DELETE_BLOCKED');
    expect(goi('DELETE', '/semesters/4').ma_loi).toBe('SEMESTER_HAS_SECTIONS');
  });
});
