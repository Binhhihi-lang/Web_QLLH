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
    // ADR-020: lớp gắn `nganh_id`; id 1 là ngành KTPM trong mock.
    nganh_id: 1,
    nam_nhap_hoc: 2026,
    mo_ta: 'Lớp dùng để kiểm thử',
    trang_thai: true,
  };

  beforeEach(() => {
    registry = new DaoTaoRegistry();
  });

  describe('DaoTaoRegistry Khoa and Ngành', () => {
    let registry: DaoTaoRegistry;

    const goi = (method: string, path: string, body: unknown = null, params = new HttpParams()) =>
      registry.resolve(method, path, params, body);

    beforeEach(() => {
      registry = new DaoTaoRegistry();
    });

    it('lists, creates, reads, and updates khoa', () => {
      const list = goi('GET', '/khoa', null, new HttpParams().set('q', 'CNTT')) as {
        data: Array<{ id: number; ma_khoa: string; so_nganh: number }>;
      };
      expect(list.data).toHaveLength(1);
      expect(list.data[0]).toMatchObject({ ma_khoa: 'CNTT', so_nganh: 4 });

      const created = goi('POST', '/khoa', {
        ma_khoa: 'YH',
        ten_khoa: 'Y học',
        mo_ta: null,
        trang_thai: true,
      }) as { data: { id: number; ma_khoa: string } };
      expect(goi('GET', `/khoa/${created.data.id}`)).toMatchObject({
        data: { ma_khoa: 'YH' },
      });

      goi('PUT', `/khoa/${created.data.id}`, {
        ma_khoa: 'YH',
        ten_khoa: 'Y học và sức khỏe',
        mo_ta: 'Đã cập nhật',
        trang_thai: false,
      });
      expect(goi('GET', `/khoa/${created.data.id}`)).toMatchObject({
        data: { ten_khoa: 'Y học và sức khỏe', trang_thai: false },
      });
    });

    it('lists ngành by khoa and blocks deleting a khoa that still has dependencies', () => {
      const list = goi('GET', '/nganh', null, new HttpParams().set('khoa_id', '1')) as {
        data: Array<{ khoa_id: number; khoa: { ten_khoa: string } }>;
      };
      expect(list.data.length).toBeGreaterThan(0);
      expect(list.data.every((row) => row.khoa_id === 1 && row.khoa.ten_khoa)).toBe(true);

      expect(goi('DELETE', '/khoa/1')).toMatchObject({
        success: false,
        ma_loi: 'DELETE_BLOCKED',
      });
    });

    it('creates and updates ngành, then exposes only active khoa in options', () => {
      const created = goi('POST', '/nganh', {
        khoa_id: 3,
        ma_nganh: 'YHCT',
        ten_nganh: 'Y học cổ truyền',
        mo_ta: null,
        trang_thai: true,
      }) as { data: { id: number; khoa_id: number } };
      expect(created.data.khoa_id).toBe(3);

      goi('PUT', `/nganh/${created.data.id}`, {
        khoa_id: 3,
        ma_nganh: 'YHCT',
        ten_nganh: 'Y học cổ truyền hiện đại',
        mo_ta: null,
        trang_thai: true,
      });
      expect(goi('GET', `/nganh/${created.data.id}`)).toMatchObject({
        data: { ten_nganh: 'Y học cổ truyền hiện đại', khoa: { ma_khoa: 'KT' } },
      });

      expect(goi('GET', '/options/khoa')).toMatchObject({
        data: expect.not.arrayContaining([expect.objectContaining({ id: 3 })]),
      });
      expect(goi('GET', '/options/nganh', null, new HttpParams().set('khoa_id', '3'))).toMatchObject({
        data: [expect.objectContaining({ id: created.data.id, khoa_id: 3 })],
      });
    });

    it('filters subjects by khoa and reflects updated khoa names in subject rows', () => {
      const filtered = goi('GET', '/subjects', null, new HttpParams().set('khoa_id', 2)) as {
        data: Array<{ khoa_id: number | null; khoa: { ten_khoa: string } | null }>;
      };
      expect(filtered.data.length).toBeGreaterThan(0);
      expect(filtered.data.every((monHoc) => monHoc.khoa_id === 2)).toBe(true);

      goi('PUT', '/khoa/1', {
        ma_khoa: 'CNTT',
        ten_khoa: 'Công nghệ số',
        mo_ta: null,
        trang_thai: true,
      });
      const subjects = goi('GET', '/subjects') as {
        data: Array<{ khoa_id: number | null; khoa: { ten_khoa: string } | null }>;
      };
      expect(subjects.data.find((monHoc) => monHoc.khoa_id === 1)?.khoa?.ten_khoa).toBe(
        'Công nghệ số',
      );

      const classes = goi('GET', '/admin-classes') as {
        data: Array<{
          nganh_id: number | null;
          nganh: { ten_nganh: string } | null;
          khoa: { ten_khoa: string } | null;
        }>;
      };
      expect(classes.data.find((lop) => lop.nganh_id === 1)?.khoa?.ten_khoa).toBe('Công nghệ số');

      const teachers = goi('GET', '/teachers') as {
        data: Array<{ id: number; nganh_id: number | null; nganh: { ten_nganh: string } | null }>;
      };
      const giangVien = teachers.data[0];
      expect(giangVien.nganh_id).not.toBeNull();
      const currentNganh = goi('GET', `/nganh/${giangVien.nganh_id}`) as {
        data: { khoa_id: number; ma_nganh: string; ten_nganh: string; mo_ta: string | null; trang_thai: boolean };
      };
      goi('PUT', `/nganh/${giangVien.nganh_id}`, {
        ...currentNganh.data,
        ten_nganh: 'Tên ngành vừa cập nhật',
      });
      const updatedTeachers = goi('GET', '/teachers') as {
        data: Array<{ id: number; nganh_id: number | null; nganh: { ten_nganh: string } | null }>;
      };
      expect(
        updatedTeachers.data.find((item) => item.id === giangVien.id)?.nganh?.ten_nganh,
      ).toBe('Tên ngành vừa cập nhật');
    });
  });

  it('creates, reads, and updates a class while enforcing unique class codes', () => {
    const created = goi('POST', '/admin-classes', lopInput) as ApiResponse<
      LopHanhChinh & { mo_ta: string | null }
    >;
    expect(created.data.ma_lop).toBe(lopInput.ma_lop);
    expect(created.data.mo_ta).toBe(lopInput.mo_ta);

    const duplicate = goi('POST', '/admin-classes', {
      ...lopInput,
      // Mã lớp đã có sẵn trong mock (lớp đầu tiên của khoa CNTT).
      ma_lop: 'KTPM-K65-01',
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
