import { HttpParams } from '@angular/common/http';
import {
  GIANG_VIEN_MOCK,
  HOC_KY_MOCK,
  LOP_HANH_CHINH_MOCK,
  LOP_HOC_PHAN_MOCK,
  MON_HOC_MOCK,
  SINH_VIEN_MOCK,
} from '@core/mock/data/danh-muc.mock';
import {
  ApiResponse,
  filterBy,
  ok,
  paginate,
  readParams,
  searchBy,
  sortBy,
  stripOrigin,
} from '@core/mock/mock-response';

/**
 * Sổ tra cứu mock: ánh xạ (method + đường dẫn) sang dữ liệu giả.
 *
 * Vì sao là lớp có trạng thái chứ không phải hàm thuần: các thao tác ghi
 * (tạo, sửa, xoá) phải thấy được ở lần đọc sau — nếu không thì không thử được
 * luồng CRUD thật. Dữ liệu chỉ nằm trong bộ nhớ, tải lại trang là về ban đầu.
 *
 * Trả `undefined` khi không có mock cho đường dẫn → interceptor để request đi
 * tiếp ra mạng thật.
 */
export class MockRegistry {
  private sinhVien = SINH_VIEN_MOCK.map((r) => ({ ...r }));
  private lopHanhChinh = LOP_HANH_CHINH_MOCK.map((r) => ({ ...r }));
  private giangVien = GIANG_VIEN_MOCK.map((r) => ({ ...r }));
  private monHoc = MON_HOC_MOCK.map((r) => ({ ...r }));
  private hocKy = HOC_KY_MOCK.map((r) => ({ ...r }));
  private lopHocPhan = LOP_HOC_PHAN_MOCK.map((r) => ({ ...r }));
  private nextId = 1000;

  resolve(
    method: string,
    urlWithParams: string,
    body: unknown,
  ): ApiResponse<unknown> | Record<string, unknown> | undefined {
    const path = stripOrigin(urlWithParams).split('?')[0];
    const params = readParams(urlWithParams);

    // ---------- Sinh viên ----------
    if (path === '/sinh-vien' && method === 'GET') {
      let rows = searchBy(this.sinhVien, params.get('keyword'), ['ma_sv', 'ho_ten', 'email']);
      rows = filterBy(rows, params, ['lop_hanh_chinh_id', 'gioi_tinh', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_sv');
      return paginate(rows, params, '/api/sinh-vien');
    }

    // ---------- Lớp hành chính ----------
    if (path === '/lop-hanh-chinh' && method === 'GET') {
      let rows = searchBy(this.lopHanhChinh, params.get('keyword'), ['ma_lop', 'ten_lop']);
      rows = filterBy(rows, params, ['trang_thai']);
      return paginate(rows, params, '/api/lop-hanh-chinh');
    }

    // ---------- Giảng viên ----------
    if (path === '/giang-vien' && method === 'GET') {
      let rows = searchBy(this.giangVien, params.get('keyword'), ['ma_gv', 'ho_ten', 'email']);
      rows = filterBy(rows, params, ['bo_mon', 'trang_thai']);
      return paginate(rows, params, '/api/giang-vien');
    }

    // ---------- Môn học ----------
    if (path === '/mon-hoc' && method === 'GET') {
      const rows = searchBy(this.monHoc, params.get('keyword'), ['ma_mon', 'ten_mon']);
      return paginate(rows, params, '/api/mon-hoc');
    }

    // ---------- Học kỳ ----------
    if (path === '/hoc-ky' && method === 'GET') {
      const rows = filterBy(this.hocKy, params, ['trang_thai']);
      return paginate(rows, params, '/api/hoc-ky');
    }

    // ---------- Lớp học phần ----------
    if (path === '/lop-hoc-phan' && method === 'GET') {
      let rows = searchBy(this.lopHocPhan, params.get('keyword'), ['ma_lop_hp', 'ten_mon_hoc', 'ten_giang_vien']);
      rows = filterBy(rows, params, ['hoc_ky_id', 'mon_hoc_id', 'giang_vien_id', 'trang_thai']);
      // Lọc "còn chỗ" — tham số riêng của màn SCR-25.
      if (params.get('con_cho') === 'true') {
        rows = rows.filter((r) => r.si_so_hien_tai < r.si_so_toi_da);
      }
      rows = sortBy(rows, params, 'ma_lop_hp');
      return paginate(rows, params, '/api/lop-hoc-phan');
    }

    // ---------- Options (dùng cho mọi dropdown) ----------
    if (path === '/options/lop-hanh-chinh' && method === 'GET') {
      return ok(this.lopHanhChinh.map((r) => ({ id: r.id, nhan: r.ma_lop })));
    }
    if (path === '/options/mon-hoc' && method === 'GET') {
      return ok(this.monHoc.map((r) => ({ id: r.id, nhan: `${r.ma_mon} — ${r.ten_mon}` })));
    }
    if (path === '/options/hoc-ky' && method === 'GET') {
      return ok(this.hocKy.map((r) => ({ id: r.id, nhan: `${r.ten_hoc_ky} ${r.nam_hoc}` })));
    }
    if (path === '/options/giang-vien' && method === 'GET') {
      return ok(this.giangVien.map((r) => ({ id: r.id, nhan: r.ho_ten })));
    }

    return undefined;
  }
}
