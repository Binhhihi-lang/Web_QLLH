import { HttpParams } from '@angular/common/http';
import { LopHanhChinh, SinhVien } from '@core/models/dao-tao.model';
import { ApiResponse, PaginatedResponse } from '@core/mock/mock-response';
import { DaoTaoRegistry } from './dao-tao.registry';

describe('DaoTaoRegistry admin classes', () => {
  let registry: DaoTaoRegistry;

  const goi = (method: string, path: string, body: unknown = null, params = new HttpParams()) =>
    registry.resolve(method, path, params, body);

  const lopInput = {
    ma_lop: 'TEST-K68-01',
    ten_lop: 'Lớp kiểm thử K68',
    khoa_hoc: 'K68',
    nganh: 'CNTT',
    nam_nhap_hoc: 2026,
    mo_ta: 'Lớp dùng để kiểm thử',
    trang_thai: true,
  };

  beforeEach(() => {
    registry = new DaoTaoRegistry();
  });

  it('creates, reads, and updates a class while enforcing unique class codes', () => {
    const created = goi('POST', '/admin-classes', lopInput) as ApiResponse<
      LopHanhChinh & { mo_ta: string | null }
    >;
    expect(created.data.ma_lop).toBe(lopInput.ma_lop);
    expect(created.data.mo_ta).toBe(lopInput.mo_ta);

    const duplicate = goi('POST', '/admin-classes', {
      ...lopInput,
      ma_lop: 'CNTT-K65-01',
    }) as { ma_loi: string };
    expect(duplicate.ma_loi).toBe('DUPLICATE_CODE');

    const updated = goi(
      'PUT',
      `/admin-classes/${created.data.id}`,
      { ...lopInput, ten_lop: 'Tên lớp đã cập nhật' },
    ) as ApiResponse<LopHanhChinh & { mo_ta: string | null }>;
    expect(updated.data.ten_lop).toBe('Tên lớp đã cập nhật');
    expect(goi('GET', `/admin-classes/${created.data.id}`)).toMatchObject({
      data: { ten_lop: 'Tên lớp đã cập nhật', mo_ta: lopInput.mo_ta },
    });
  });

  it('transfers students between classes and removes them without deleting their records', () => {
    const students = goi(
      'GET',
      '/students',
      null,
      new HttpParams().set('page', 1).set('per_page', 100),
    ) as PaginatedResponse<SinhVien>;
    const student = students.data.find((sv) => sv.lop_hanh_chinh?.id !== 1);
    expect(student).toBeDefined();

    const beforeCount = goi('GET', '/admin-classes/1') as ApiResponse<LopHanhChinh>;
    goi('POST', '/admin-classes/1/students', { sinh_vien_ids: [student!.id] });

    const roster = goi(
      'GET',
      '/admin-classes/1/students',
      null,
      new HttpParams().set('page', 1).set('per_page', 100),
    ) as PaginatedResponse<SinhVien>;
    expect(roster.data.some((sv) => sv.id === student!.id)).toBe(true);

    const afterTransfer = goi('GET', '/admin-classes/1') as ApiResponse<LopHanhChinh>;
    expect(afterTransfer.data.si_so).toBe(beforeCount.data.si_so + 1);
    expect(goi('GET', `/students/${student!.id}`)).toMatchObject({
      data: { lop_hanh_chinh: { id: 1 } },
    });

    goi('DELETE', `/admin-classes/1/students/${student!.id}`);
    expect(goi('GET', `/students/${student!.id}`)).toMatchObject({
      data: { lop_hanh_chinh: null },
    });
    expect(goi('GET', '/admin-classes/1')).toMatchObject({
      data: { si_so: beforeCount.data.si_so },
    });
  });

  it('blocks deletion while students remain and soft-deletes an empty class', () => {
    const blocked = goi('DELETE', '/admin-classes/1') as { ma_loi: string };
    expect(blocked.ma_loi).toBe('DELETE_BLOCKED');
    expect(goi('GET', '/admin-classes/1')).toMatchObject({
      data: { id: 1 },
    });

    const created = goi('POST', '/admin-classes', lopInput) as ApiResponse<
      LopHanhChinh & { mo_ta: string | null }
    >;
    expect(goi('DELETE', `/admin-classes/${created.data.id}`)).toMatchObject({
      data: null,
      success: true,
    });
    expect(goi('GET', `/admin-classes/${created.data.id}`)).toMatchObject({
      ma_loi: 'NOT_FOUND',
    });
    expect(goi('GET', '/options/admin-classes')).not.toMatchObject({
      data: expect.arrayContaining([expect.objectContaining({ id: created.data.id })]),
    });
  });
});
