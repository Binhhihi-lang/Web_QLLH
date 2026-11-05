import { HttpParams } from '@angular/common/http';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import { SystemRegistry } from '@core/mock/registry/system.registry';
import { HocVuRegistry } from './hoc-vu.registry';

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
});
