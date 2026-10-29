import { HttpParams } from '@angular/common/http';
import { MON_HOC_MOCK, SINH_VIEN_MOCK, GIANG_VIEN_MOCK } from '@core/mock/data/dao-tao.mock';
import { ok, loi, paginate, searchBy, MaLoi } from '@core/mock/mock-response';

/**
 * Mock cho thùng rác (SCR-45).
 */
export class TrashRegistry {
  private readonly monHocDaXoa = [
    {
      id: 991,
      ma_mon: 'INT9901',
      ten_mon: 'Môn học thử nghiệm cũ',
      so_tin_chi: 3,
      deleted_at: '2026-10-20 14:30:00',
      xoa_boi: { id: 1, name: 'Quản trị viên', email: 'admin@qllh.test' },
    },
    {
      id: 992,
      ma_mon: 'INT9902',
      ten_mon: 'Kỹ nghệ phần mềm nâng cao (cũ)',
      so_tin_chi: 4,
      deleted_at: '2026-10-22 09:15:00',
      xoa_boi: { id: 1, name: 'Quản trị viên', email: 'admin@qllh.test' },
    },
  ];

  private readonly sinhVienDaXoa = [
    {
      id: 981,
      ma_sv: 'SV990001',
      ho_ten: 'Nguyễn Văn Đã Xóa',
      email: 'sv990001@university.edu.vn',
      deleted_at: '2026-10-21 11:00:00',
      xoa_boi: { id: 1, name: 'Quản trị viên', email: 'admin@qllh.test' },
    },
  ];

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    _body: unknown = null,
    vaiTro: string | null = null,
  ): object | undefined {
    // Chỉ ADMIN được xem thùng rác
    if (path.startsWith('/trash/')) {
      if (vaiTro !== 'ADMIN') {
        return loi(MaLoi.FORBIDDEN, 'Bạn không có quyền truy cập thùng rác.');
      }
    }

    // Danh sách thùng rác
    const listMatch = path.match(/^\/trash\/([a-z-]+)$/);
    if (listMatch && method === 'GET') {
      const type = listMatch[1];
      let rows: Array<Record<string, unknown>> = [];

      if (type === 'subjects') {
        rows = [...this.monHocDaXoa];
      } else if (type === 'students') {
        rows = [...this.sinhVienDaXoa];
      } else {
        rows = [];
      }

      if (params.get('q')) {
        const q = params.get('q')!.toLowerCase();
        rows = rows.filter((r) =>
          Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)),
        );
      }

      return paginate(rows, params, `/api/trash/${type}`);
    }

    // Khôi phục
    const restoreMatch = path.match(/^\/trash\/([a-z-]+)\/(\d+)\/restore$/);
    if (restoreMatch && method === 'POST') {
      const type = restoreMatch[1];
      const id = Number(restoreMatch[2]);

      if (type === 'subjects') {
        const idx = this.monHocDaXoa.findIndex((r) => r.id === id);
        if (idx >= 0) {
          const restored = this.monHocDaXoa.splice(idx, 1)[0];
          return ok(restored, 'Khôi phục môn học thành công.');
        }
      } else if (type === 'students') {
        const idx = this.sinhVienDaXoa.findIndex((r) => r.id === id);
        if (idx >= 0) {
          const restored = this.sinhVienDaXoa.splice(idx, 1)[0];
          return ok(restored, 'Khôi phục sinh viên thành công.');
        }
      }

      return loi(MaLoi.NOT_FOUND, 'Không tìm thấy bản ghi trong thùng rác.');
    }

    return undefined;
  }
}

