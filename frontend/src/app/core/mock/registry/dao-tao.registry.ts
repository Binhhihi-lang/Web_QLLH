import { HttpParams } from '@angular/common/http';
import {
  LOP_HANH_CHINH_MOCK,
  MON_HOC_MOCK,
  SINH_VIEN_MOCK,
  GIANG_VIEN_MOCK,
  HOC_KY_MOCK,
} from '@core/mock/data/dao-tao.mock';
import {
  KetQuaDong,
  KetQuaHangLoat,
  MaLoi,
  filterBy,
  loi,
  loiValidation,
  ok,
  paginate,
  searchBy,
  sortBy,
} from '@core/mock/mock-response';

/**
 * Mock cho nhóm ĐÀO TẠO — thuộc Đức Anh.
 *
 * Mỗi registry con tự khai dữ liệu của mình để hai bạn FE không sửa cùng một
 * file. Thêm endpoint mới thì thêm ở đây, không đụng registry của nhóm kia.
 *
 * Đường dẫn dùng tiếng Anh đúng docs/04-api-contract.md; trường JSON tiếng Việt.
 */
export class DaoTaoRegistry {
  private sinhVien = SINH_VIEN_MOCK.map((r) => ({ ...r }));
  private lopHanhChinh = LOP_HANH_CHINH_MOCK.map((r) => ({ ...r }));
  private giangVien = GIANG_VIEN_MOCK.map((r) => ({ ...r }));
  private monHoc = MON_HOC_MOCK.map((r) => ({ ...r }));
  private hocKy = HOC_KY_MOCK.map((r) => ({ ...r }));

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
  ): object | undefined {
    // ---------- Sinh viên ----------
    if (path === '/students' && method === 'GET') {
      // Bản ghi đã xoá mềm không bao giờ lộ ra danh sách — FR-14.01.
      let rows = this.sinhVien.filter((r) => !r.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_sv', 'ho_ten', 'email']);
      // `lop_hanh_chinh_id` và `khoa_hoc` lọc trên object lồng, nên phải tách
      // ra khỏi `filterBy` (vốn so sánh trường phẳng).
      const lopId = params.get('lop_hanh_chinh_id');
      if (lopId) rows = rows.filter((r) => r.lop_hanh_chinh?.id === Number(lopId));

      const khoa = params.get('khoa_hoc');
      if (khoa) {
        const idTrongKhoa = new Set(
          this.lopHanhChinh.filter((l) => l.khoa_hoc === khoa).map((l) => l.id),
        );
        rows = rows.filter((r) => r.lop_hanh_chinh && idTrongKhoa.has(r.lop_hanh_chinh.id));
      }
      rows = filterBy(rows, params, ['gioi_tinh', 'trang_thai']);
      rows = locTheoNgaySinh(rows, params);
      rows = sortBy(rows, params, 'ma_sv');
      return paginate(rows, params, '/api/students');
    }

    const chiTietSv = path.match(/^\/students\/(\d+)$/);
    if (chiTietSv && method === 'GET') {
      const sv = this.sinhVien.find((r) => r.id === Number(chiTietSv[1]) && !r.da_xoa);
      return sv ? ok(sv) : loi(MaLoi.NOT_FOUND, 'Không tìm thấy sinh viên.');
    }

    if (chiTietSv && method === 'DELETE') {
      const id = Number(chiTietSv[1]);
      const co = this.sinhVien.some((r) => r.id === id && !r.da_xoa);
      if (!co) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy sinh viên.');
      // Xóa mềm: giữ bản ghi, chỉ đánh dấu — đúng FR-14.01.
      this.sinhVien = this.sinhVien.map((r) => (r.id === id ? { ...r, da_xoa: true } : r));
      return ok(null, 'Đã xóa sinh viên.');
    }

    // ---------- Sinh viên: thao tác hàng loạt (BR-31) ----------
    // bulk-status dùng PATCH, bulk-delete dùng POST — đúng bảng docs/04 mục 5.
    if (path === '/students/bulk-status' && method === 'PATCH') {
      return this.hangLoat(this.sinhVien, body, (r, tt) => ({ ...r, trang_thai: tt }));
    }
    if (path === '/students/bulk-delete' && method === 'POST') {
      return this.hangLoat(this.sinhVien, body, (r) => ({ ...r, da_xoa: true }));
    }

    // ---------- Lớp hành chính ----------
    if (path === '/admin-classes' && method === 'GET') {
      let rows = searchBy(this.lopHanhChinh, params.get('q'), ['ma_lop', 'ten_lop']);
      rows = filterBy(rows, params, ['khoa_hoc', 'nganh', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_lop');
      return paginate(rows, params, '/api/admin-classes');
    }

    // ---------- Giảng viên ----------
    if (path === '/teachers' && method === 'GET') {
      let rows = searchBy(this.giangVien, params.get('q'), ['ma_gv', 'ho_ten', 'email']);
      rows = filterBy(rows, params, ['chuyen_mon', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_gv');
      return paginate(rows, params, '/api/teachers');
    }

    // ---------- Môn học ----------
    if (path === '/subjects' && method === 'GET') {
      let rows = searchBy(this.monHoc, params.get('q'), ['ma_mon', 'ten_mon']);
      rows = filterBy(rows, params, ['trang_thai']);
      rows = sortBy(rows, params, 'ma_mon');
      return paginate(rows, params, '/api/subjects');
    }

    // ---------- Học kỳ ----------
    if (path === '/semesters' && method === 'GET') {
      let rows = filterBy(this.hocKy, params, ['trang_thai', 'nam_hoc', 'ky_thu']);
      rows = sortBy(rows, params, 'ma_hoc_ky');
      return paginate(rows, params, '/api/semesters');
    }

    // ---------- Options thuộc nhóm đào tạo ----------
    if (path === '/options/admin-classes' && method === 'GET') {
      return ok(
        this.lopHanhChinh.map((r) => ({
          id: r.id,
          label: r.ma_lop,
          khoa_hoc: r.khoa_hoc,
          nganh: r.nganh,
        })),
      );
    }
    if (path === '/options/subjects' && method === 'GET') {
      return ok(
        this.monHoc.map((r) => ({
          id: r.id,
          label: `${r.ma_mon} — ${r.ten_mon}`,
          so_tin_chi: r.so_tin_chi,
        })),
      );
    }
    if (path === '/options/semesters' && method === 'GET') {
      return ok(
        this.hocKy.map((r) => ({
          id: r.id,
          label: r.ten_hoc_ky,
          nam_hoc: r.nam_hoc,
          ky_thu: r.ky_thu,
          trang_thai: r.trang_thai,
        })),
      );
    }
    if (path === '/options/teachers' && method === 'GET') {
      return ok(this.giangVien.map((r) => ({ id: r.id, label: r.ho_ten })));
    }

    return undefined;
  }

  /**
   * Xử lý hàng loạt theo BR-31: từng dòng độc lập, luôn 200, rỗng → 422.
   *
   * `apDung` nhận bản ghi và (với bulk-status) trạng thái mới, trả bản ghi đã
   * sửa. Dòng không tồn tại hoặc đã xóa mềm thì báo `NOT_FOUND` riêng, không
   * làm hỏng các dòng còn lại — đây chính là điểm khác biệt so với xử lý gộp.
   */
  private hangLoat<T extends { id: number; da_xoa: boolean }>(
    nguon: T[],
    body: unknown,
    apDung: (row: T, trangThai: boolean) => T,
  ): object {
    const duLieu = (body ?? {}) as { ids?: unknown; trang_thai?: unknown };
    const ids = Array.isArray(duLieu.ids) ? duLieu.ids : null;

    if (!ids || ids.length === 0) {
      return loiValidation({ ids: ['Cần chọn ít nhất một bản ghi.'] });
    }
    if (ids.length > 500) {
      return loiValidation({ ids: ['Chỉ xử lý tối đa 500 bản ghi mỗi lần.'] });
    }

    const trangThai = duLieu.trang_thai === true || duLieu.trang_thai === 'true';
    const chiTiet: KetQuaDong[] = [];

    for (const idTho of ids) {
      const id = Number(idTho);
      const co = nguon.some((r) => r.id === id && !r.da_xoa);

      if (!co) {
        chiTiet.push({
          id,
          ket_qua: 'THAT_BAI',
          ma_loi: MaLoi.NOT_FOUND,
          message: 'Không tìm thấy bản ghi.',
        });
        continue;
      }

      const viTri = nguon.findIndex((r) => r.id === id);
      nguon[viTri] = apDung(nguon[viTri], trangThai);
      chiTiet.push({ id, ket_qua: 'THANH_CONG' });
    }

    const thanhCong = chiTiet.filter((c) => c.ket_qua === 'THANH_CONG').length;
    const ketQua: KetQuaHangLoat = {
      thanh_cong: thanhCong,
      that_bai: chiTiet.length - thanhCong,
      chi_tiet: chiTiet,
    };

    return ok(ketQua, `Đã xử lý ${thanhCong}/${chiTiet.length} bản ghi.`);
  }
}

/**
 * Lọc theo khoảng ngày sinh — `ngay_sinh_tu` / `ngay_sinh_den` dạng `YYYY-MM-DD`.
 *
 * So sánh chuỗi ISO được vì định dạng này sắp xếp đúng theo thứ tự thời gian;
 * đổi sang Date chỉ thêm chỗ sai lệch múi giờ. Bản ghi không có ngày sinh bị
 * loại khi có lọc — đúng như SQL `WHERE ngay_sinh BETWEEN …`.
 */
function locTheoNgaySinh<T extends { ngay_sinh: string | null }>(
  rows: T[],
  params: HttpParams,
): T[] {
  const tu = params.get('ngay_sinh_tu');
  const den = params.get('ngay_sinh_den');
  if (!tu && !den) return rows;

  return rows.filter((r) => {
    if (!r.ngay_sinh) return false;
    if (tu && r.ngay_sinh < tu) return false;
    if (den && r.ngay_sinh > den) return false;
    return true;
  });
}
