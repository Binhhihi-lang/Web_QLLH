import { HttpParams } from '@angular/common/http';
import { ok, loi, paginate, searchBy, MaLoi } from '@core/mock/mock-response';
import { CAC_LOAI_THUC_THE } from '@core/services/thung-rac.service';

/**
 * Mock cho thùng rác (SCR-45).
 */
export class TrashRegistry {
  private readonly cacLoai = new Set<string>(CAC_LOAI_THUC_THE.map((item) => item.ma));
  private readonly rowsByType: Record<string, Array<Record<string, unknown>>> = {
    subjects: [
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
    ],
    students: [
      {
        id: 981,
        ma_sv: 'SV990001',
        ho_ten: 'Nguyễn Văn Đã Xóa',
        email: 'sv990001@university.edu.vn',
        deleted_at: '2026-10-21 11:00:00',
        xoa_boi: { id: 1, name: 'Quản trị viên', email: 'admin@qllh.test' },
      },
    ],
    khoa: [
      {
        id: 971,
        ma_khoa: 'KHOA-DA-XOA',
        ten_khoa: 'Khoa mẫu đã xóa',
        deleted_at: '2026-10-23 09:00:00',
        xoa_boi: { id: 1, name: 'Quản trị viên', email: 'admin@qllh.test' },
      },
    ],
  };

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
      if (!this.cacLoai.has(type)) {
        return loi(MaLoi.NOT_FOUND, `Loại thực thể '${type}' không được hỗ trợ.`);
      }
      let rows = [...(this.rowsByType[type] ?? [])];
      rows = searchBy(rows, params.get('q'), Object.keys(rows[0] ?? {}));
      const deletedBy = params.get('deleted_by');
      if (deletedBy) {
        rows = rows.filter(
          (row) =>
            row['xoa_boi'] !== null &&
            typeof row['xoa_boi'] === 'object' &&
            String((row['xoa_boi'] as Record<string, unknown>)['id']) === deletedBy,
        );
      }
      const from = params.get('deleted_tu');
      const to = params.get('deleted_den');
      if (from) rows = rows.filter((row) => String(row['deleted_at'] ?? '') >= from);
      if (to) rows = rows.filter((row) => String(row['deleted_at'] ?? '').slice(0, 10) <= to);

      return paginate(rows, params, `/api/trash/${type}`);
    }

    // Khôi phục
    const restoreMatch = path.match(/^\/trash\/([a-z-]+)\/(\d+)\/restore$/);
    if (restoreMatch && method === 'POST') {
      const type = restoreMatch[1];
      const id = Number(restoreMatch[2]);
      if (!this.cacLoai.has(type)) {
        return loi(MaLoi.NOT_FOUND, `Loại thực thể '${type}' không được hỗ trợ.`);
      }
      const rows = this.rowsByType[type] ?? [];
      const index = rows.findIndex((row) => row['id'] === id);
      if (index >= 0) {
        const [restored] = rows.splice(index, 1);
        return ok(restored, `Khôi phục ${type} thành công.`);
      }

      return loi(MaLoi.NOT_FOUND, 'Không tìm thấy bản ghi trong thùng rác.');
    }

    return undefined;
  }
}
