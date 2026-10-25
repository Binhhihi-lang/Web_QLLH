import { HttpParams } from '@angular/common/http';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import { DASHBOARD_ADMIN_MOCK } from '@core/mock/data/dashboard.mock';
import { filterBy, ok, paginate, searchBy, sortBy } from '@core/mock/mock-response';

/**
 * Mock cho nhóm HỌC VỤ — thuộc Đạt.
 *
 * Lớp học phần, lịch, đăng ký, điểm danh, điểm, dashboard. Thêm endpoint mới
 * thì thêm ở đây, không đụng registry đào tạo của Đức Anh.
 */
export class HocVuRegistry {
  private lopHocPhan = LOP_HOC_PHAN_MOCK.map((r) => ({ ...r }));

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    // Chưa dùng ở nhóm này; giữ tham số để chữ ký khớp `DaoTaoRegistry`.
    _body: unknown = null,
  ): object | undefined {
    // ---------- Lớp học phần ----------
    if (path === '/sections' && method === 'GET') {
      let rows = searchBy(this.lopHocPhan, params.get('q'), [
        'ma_lop_hp',
        'mon_hoc.ten_mon',
        'giang_vien.ho_ten',
      ]);
      rows = filterBy(rows, params, [
        'hoc_ky.id',
        'mon_hoc.id',
        'giang_vien.id',
        'nam_thu',
        'trang_thai',
      ]);
      // Lọc "còn chỗ" — tham số riêng của màn SCR-25.
      if (params.get('con_cho') === 'true') {
        rows = rows.filter((r) => r.si_so_hien_tai < r.si_so_toi_da);
      }
      rows = sortBy(rows, params, 'ma_lop_hp');
      return paginate(rows, params, '/api/sections');
    }

    // ---------- Dashboard ----------
    if (path === '/dashboard/admin' && method === 'GET') {
      return ok(DASHBOARD_ADMIN_MOCK);
    }

    // ---------- Options thuộc nhóm học vụ ----------
    if (path === '/options/sections' && method === 'GET') {
      return ok(
        this.lopHocPhan
          .filter((r) => r.trang_thai === 'OPEN')
          .map((r) => ({
            id: r.id,
            label: `${r.ma_lop_hp} — ${r.mon_hoc.ten_mon}`,
            con_cho: Math.max(0, r.si_so_toi_da - r.si_so_hien_tai),
            nam_thu: r.nam_thu,
          })),
      );
    }
    if (path === '/options/rooms' && method === 'GET') {
      // Chưa có dữ liệu phòng trong mock — trả rỗng để dropdown không vỡ.
      return ok([]);
    }

    return undefined;
  }
}
