import { HttpParams } from '@angular/common/http';
import { HOC_KY_MOCK } from '@core/mock/data/dao-tao.mock';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import { SystemRegistry } from '@core/mock/registry/system.registry';
import { HocVuRegistry } from './hoc-vu.registry';

describe('HocVuRegistry — đăng ký học phần', () => {
  it('returns the authenticated student enrollments with the contract pagination shape', () => {
    const registry = new HocVuRegistry(new SystemRegistry());
    const result = registry.resolve(
      'GET',
      '/me/enrollments',
      new HttpParams(),
      null,
      'SINH_VIEN',
    ) as {
      data: Array<{ sinh_vien: { id: number }; trang_thai: string }>;
      meta: { total: number };
    };

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta.total).toBe(result.data.length);
    expect(result.data.every((row) => row.sinh_vien.id === 1)).toBe(true);
  });

  it('enforces the registration window for student self-enrollment', () => {
    const registry = new HocVuRegistry(new SystemRegistry());
    const section = LOP_HOC_PHAN_MOCK.find(
      (row) => row.hoc_ky.id === 3 && row.trang_thai === 'OPEN',
    );
    expect(section).toBeDefined();
    const semester = HOC_KY_MOCK.find((row) => row.id === 3);
    expect(semester?.dang_mo_dang_ky).toBe(false);

    const result = registry.resolve(
      'POST',
      '/me/enrollments',
      new HttpParams(),
      { lop_hoc_phan_id: section!.id },
      'SINH_VIEN',
    ) as { success: boolean; ma_loi: string };

    expect(result).toMatchObject({ success: false, ma_loi: 'OUTSIDE_REGISTRATION' });
  });

  it('returns one independent outcome per student in an administrative bulk request', () => {
    const registry = new HocVuRegistry(new SystemRegistry());
    const section = LOP_HOC_PHAN_MOCK.find((row) => row.trang_thai === 'OPEN');
    expect(section).toBeDefined();

    const result = registry.resolve(
      'POST',
      '/enrollments/bulk',
      new HttpParams(),
      { lop_hoc_phan_id: section!.id, lop_hanh_chinh_id: 1 },
      'ADMIN',
    ) as {
      success: boolean;
      data: { thanh_cong: number; that_bai: number; chi_tiet: unknown[] };
    };

    expect(result.success).toBe(true);
    expect(result.data.chi_tiet).toHaveLength(result.data.thanh_cong + result.data.that_bai);
    expect(result.data.chi_tiet.length).toBeGreaterThan(0);
  });
});

describe('HocVuRegistry — bảng điểm theo cấu hình', () => {
  it('uses the shared settings for mock grade calculations', () => {
    const system = new SystemRegistry();
    const update = system.resolve(
      'PUT',
      '/settings',
      new HttpParams(),
      {
        hoc_ky_id: 4,
        'diem.trong_so': { chuyen_can: 0.5, giua_ky: 0.25, cuoi_ky: 0.25 },
        'diem.bang_quy_doi': [
          { tu: 0, den: 10, chu: 'B+', he_4: 3.5, xep_loai: 'Khá giỏi', dat: true },
        ],
      },
      'ADMIN',
    ) as { success: boolean };
    const registry = new HocVuRegistry(system);
    const sectionId = LOP_HOC_PHAN_MOCK.find((row) => row.hoc_ky.id === 4)!.id;
    const students = registry.resolve(
      'GET',
      `/sections/${sectionId}/students`,
      new HttpParams(),
    ) as { data: Array<{ dang_ky_hoc_phan_id: number }> };
    const result = registry.resolve(
      'PUT',
      `/sections/${sectionId}/grades`,
      new HttpParams(),
      {
        diem: [
          {
            dang_ky_hoc_phan_id: students.data[0].dang_ky_hoc_phan_id,
            diem_chuyen_can: 10,
            diem_giua_ky: 0,
            diem_cuoi_ky: 0,
          },
        ],
      },
    ) as { data: Array<Record<string, unknown>> };

    expect(update.success).toBe(true);
    expect(result.data[0]).toMatchObject({
      diem_tong_ket: 5,
      diem_chu: 'B+',
      diem_he_4: 3.5,
      xep_loai: 'Khá giỏi',
    });
  });

  describe('HocVuRegistry — điểm danh', () => {
    it('lists sessions, saves their attendance and returns the section summary', () => {
      const registry = new HocVuRegistry(new SystemRegistry());
      const section = LOP_HOC_PHAN_MOCK.find((row) => row.si_so_hien_tai > 0)!;
      const sessions = registry.resolve(
        'GET',
        `/sections/${section.id}/sessions`,
        new HttpParams(),
        null,
        'GIANG_VIEN',
      ) as { data: Array<{ id: number }> };
      const sessionId = sessions.data[1].id;
      const attendance = registry.resolve(
        'GET',
        `/sessions/${sessionId}/attendance`,
        new HttpParams(),
        null,
        'GIANG_VIEN',
      ) as {
        data: { danh_sach: Array<{ dang_ky_hoc_phan_id: number; trang_thai: string | null }> };
      };
      const payload = {
        diem_danh: attendance.data.danh_sach.map((row) => ({
          dang_ky_hoc_phan_id: row.dang_ky_hoc_phan_id,
          trang_thai: 'PRESENT',
          ghi_chu: null,
        })),
      };
      const saved = registry.resolve(
        'PUT',
        `/sessions/${sessionId}/attendance`,
        new HttpParams(),
        payload,
        'GIANG_VIEN',
      ) as { data: { buoi_hoc_id: number; so_luong: number; trang_thai_buoi_hoc: string } };
      const summary = registry.resolve(
        'GET',
        `/sections/${section.id}/attendance-summary`,
        new HttpParams(),
        null,
        'GIANG_VIEN',
      ) as {
        data: { tong_buoi: number; sinh_vien: Array<{ co_mat: number; ty_le: number | null }> };
      };

      const savedLai = registry.resolve(
        'GET',
        `/sessions/${sessionId}/attendance`,
        new HttpParams(),
        null,
        'GIANG_VIEN',
      ) as { data: { danh_sach: Array<{ trang_thai: string | null }> } };

      expect(sessions.data).toHaveLength(3);
      expect(saved.data.so_luong).toBe(payload.diem_danh.length);
      expect(savedLai.data.danh_sach.every((row) => row.trang_thai === 'PRESENT')).toBe(true);
      expect(summary.data.tong_buoi).toBe(3);
      expect(summary.data.sinh_vien[0].co_mat).toBe(2);
      expect(summary.data.sinh_vien[0].ty_le).toBe(1);
    });
  });
});
