import { HttpParams } from '@angular/common/http';
import {
  GiangVien,
  Khoa,
  KhoaRutGon,
  LopHanhChinh,
  MonHoc,
  Nganh,
  PhongHoc,
  NganhRutGon,
  SinhVien,
  HocKy,
  TrangThaiHocKy,
} from '@core/models/dao-tao.model';
import {
  LOP_HANH_CHINH_MOCK,
  MON_HOC_MOCK,
  SINH_VIEN_MOCK,
  GIANG_VIEN_MOCK,
  HOC_KY_MOCK,
  PHONG_HOC_MOCK,
  KHOA_MOCK,
  NGANH_MOCK,
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
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import { SystemRegistry } from '@core/mock/registry/system.registry';

/**
 * Mock cho nhóm ĐÀO TẠO — thuộc Đức Anh.
 *
 * Mỗi registry con tự khai dữ liệu của mình để hai bạn FE không sửa cùng một
 * file. Thêm endpoint mới thì thêm ở đây, không đụng registry của nhóm kia.
 *
 * Đường dẫn dùng tiếng Anh đúng docs/04-api-contract.md; trường JSON tiếng Việt.
 */
export class DaoTaoRegistry {
  constructor(private readonly system: SystemRegistry = new SystemRegistry()) {}

  private readonly phongCoBuoiHocSapToi = new Set([2, 8]);
  private sinhVien = SINH_VIEN_MOCK.map((r) => ({ ...r }));
  private lopHanhChinh = LOP_HANH_CHINH_MOCK.map((r) => ({ ...r }));
  private moTaLop = new Map<number, string | null>();
  private giangVien = GIANG_VIEN_MOCK.map((r) => ({ ...r }));
  private monHoc = MON_HOC_MOCK.map((r) => ({ ...r }));
  private phongHoc = PHONG_HOC_MOCK.map((r) => ({ ...r }));
  private hocKy = HOC_KY_MOCK.map((r) => ({ ...r }));
  private hocKyDaXoa = new Set<number>();
  private khoa = KHOA_MOCK.map((r) => ({ ...r }));
  private nganh = NGANH_MOCK.map((r) => ({ ...r }));

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
    _vaiTro: string | null = null,
  ): object | undefined {
    const danhMucKhoaNganh = this.xuLyKhoaNganh(method, path, params, body);
    if (danhMucKhoaNganh !== undefined) return danhMucKhoaNganh;

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

    if (path === '/students' && method === 'POST') {
      const ketQua = this.chuanHoaSinhVien(body);
      const loiDuLieu = this.loiDuLieuSinhVien(ketQua);
      if (loiDuLieu) return loiDuLieu;

      const lop = ketQua.lop;
      const sinhVien: SinhVien = {
        id: Math.max(0, ...this.sinhVien.map((r) => r.id)) + 1,
        ...ketQua.duLieu,
        lop_hanh_chinh: lop ? { id: lop.id, ma_lop: lop.ma_lop, ten_lop: lop.ten_lop } : null,
        avatar_url: null,
        da_xoa: false,
      };
      this.sinhVien.push(sinhVien);

      // Mật khẩu mock cố định để kiểm thử ổn định; backend thật sinh mật khẩu ngẫu nhiên.
      return ok({ ...sinhVien, mat_khau_ban_dau: 'MockSV2026!!' });
    }

    const chiTietSv = path.match(/^\/students\/(\d+)$/);
    if (chiTietSv && method === 'GET') {
      const sv = this.sinhVien.find((r) => r.id === Number(chiTietSv[1]) && !r.da_xoa);
      return sv ? ok(sv) : loi(MaLoi.NOT_FOUND, 'Không tìm thấy sinh viên.');
    }

    if (chiTietSv && method === 'PUT') {
      const id = Number(chiTietSv[1]);
      const viTri = this.sinhVien.findIndex((r) => r.id === id && !r.da_xoa);
      if (viTri === -1) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy sinh viên.');

      const ketQua = this.chuanHoaSinhVien(body, id);
      const loiDuLieu = this.loiDuLieuSinhVien(ketQua);
      if (loiDuLieu) return loiDuLieu;

      const lop = ketQua.lop;
      this.sinhVien[viTri] = {
        ...this.sinhVien[viTri],
        ...ketQua.duLieu,
        lop_hanh_chinh: lop ? { id: lop.id, ma_lop: lop.ma_lop, ten_lop: lop.ten_lop } : null,
      };
      return ok(this.sinhVien[viTri], 'Đã cập nhật sinh viên.');
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
      let rows = this.lopHanhChinh.filter((r) => !r.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_lop', 'ten_lop']);
      rows = filterBy(rows, params, ['khoa_hoc', 'nganh', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_lop');
      return paginate(rows, params, '/api/admin-classes');
    }
    if (path === '/admin-classes' && method === 'POST') {
      const ketQua = this.chuanHoaLop(body);
      const loiDuLieu = this.loiDuLieuLop(ketQua);
      if (loiDuLieu) return loiDuLieu;

      const lop: LopHanhChinh = {
        id: Math.max(0, ...this.lopHanhChinh.map((r) => r.id)) + 1,
        ...ketQua.duLieu,
        si_so: 0,
        da_xoa: false,
      };
      this.lopHanhChinh.push(lop);
      this.moTaLop.set(lop.id, ketQua.mo_ta);
      return ok({ ...lop, mo_ta: ketQua.mo_ta }, 'Tạo lớp hành chính thành công.');
    }

    const lopHanhChinhId = path.match(/^\/admin-classes\/(\d+)$/);
    if (lopHanhChinhId && method === 'DELETE') {
      const id = Number(lopHanhChinhId[1]);
      const lop = this.lopHanhChinh.find((r) => r.id === id && !r.da_xoa);
      if (!lop) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy lớp hành chính.');
      if (this.demSinhVien(id) > 0) {
        return loi(
          MaLoi.DELETE_BLOCKED,
          'Không thể xóa lớp còn sinh viên chưa xóa. Hãy gỡ hoặc chuyển sinh viên trước.',
        );
      }

      lop.da_xoa = true;
      return ok(null, 'Đã xóa lớp hành chính.');
    }
    if (lopHanhChinhId && method === 'GET') {
      const id = Number(lopHanhChinhId[1]);
      const lop = this.lopHanhChinh.find((r) => r.id === id && !r.da_xoa);
      return lop
        ? ok({ ...lop, si_so: this.demSinhVien(id), mo_ta: this.moTaLop.get(id) ?? null })
        : loi(MaLoi.NOT_FOUND, 'Không tìm thấy lớp hành chính.');
    }
    if (lopHanhChinhId && method === 'PUT') {
      const id = Number(lopHanhChinhId[1]);
      const index = this.lopHanhChinh.findIndex((r) => r.id === id && !r.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy lớp hành chính.');

      const ketQua = this.chuanHoaLop(body, id);
      const loiDuLieu = this.loiDuLieuLop(ketQua);
      if (loiDuLieu) return loiDuLieu;

      this.lopHanhChinh[index] = { ...this.lopHanhChinh[index], ...ketQua.duLieu };
      this.moTaLop.set(id, ketQua.mo_ta);
      this.sinhVien = this.sinhVien.map((student) =>
        student.lop_hanh_chinh?.id === id
          ? {
              ...student,
              lop_hanh_chinh: {
                id,
                ma_lop: ketQua.duLieu.ma_lop,
                ten_lop: ketQua.duLieu.ten_lop,
              },
            }
          : student,
      );
      return ok(
        {
          ...this.lopHanhChinh[index],
          si_so: this.demSinhVien(id),
          mo_ta: ketQua.mo_ta,
        },
        'Cập nhật lớp hành chính thành công.',
      );
    }

    const roster = path.match(/^\/admin-classes\/(\d+)\/students$/);
    if (roster && method === 'GET') {
      const lopId = Number(roster[1]);
      if (!this.lopHanhChinh.some((r) => r.id === lopId && !r.da_xoa)) {
        return loi(MaLoi.NOT_FOUND, 'Không tìm thấy lớp hành chính.');
      }
      let rows = this.sinhVien.filter((r) => !r.da_xoa && r.lop_hanh_chinh?.id === lopId);
      rows = searchBy(rows, params.get('q'), ['ma_sv', 'ho_ten', 'email']);
      const trangThai = params.get('trang_thai');
      if (trangThai === 'true' || trangThai === 'false') {
        rows = rows.filter((sinhVien) => sinhVien.trang_thai === (trangThai === 'true'));
      }
      rows = sortBy(rows, params, 'ho_ten');
      return paginate(rows, params, `/api/admin-classes/${lopId}/students`);
    }
    if (roster && method === 'POST') {
      const lopId = Number(roster[1]);
      const lop = this.lopHanhChinh.find((r) => r.id === lopId && !r.da_xoa);
      if (!lop) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy lớp hành chính.');

      const ids =
        body && typeof body === 'object' && !Array.isArray(body)
          ? (body as Record<string, unknown>)['sinh_vien_ids']
          : undefined;
      const errors: Record<string, string[]> = {};
      if (!Array.isArray(ids)) {
        errors['sinh_vien_ids'] = ['Danh sách sinh viên phải có từ 1 đến 500 mã.'];
      } else if (ids.length === 0 || ids.length > 500) {
        errors['sinh_vien_ids'] = ['Danh sách sinh viên phải có từ 1 đến 500 mã.'];
      } else if (ids.some((id) => !Number.isInteger(id) || Number(id) <= 0)) {
        errors['sinh_vien_ids'] = ['Mã sinh viên không hợp lệ.'];
      } else if (new Set(ids).size !== ids.length) {
        errors['sinh_vien_ids'] = ['Danh sách không được có mã sinh viên trùng lặp.'];
      } else if (ids.some((id) => !this.sinhVien.some((sv) => sv.id === id && !sv.da_xoa))) {
        errors['sinh_vien_ids'] = ['Một hoặc nhiều sinh viên không tồn tại.'];
      }
      if (Object.keys(errors).length) return loiValidation(errors);

      const studentIds = ids as number[];
      for (const id of studentIds) {
        const student = this.sinhVien.find((sv) => sv.id === id && !sv.da_xoa)!;
        const previousClassId = student.lop_hanh_chinh?.id;
        if (previousClassId === lopId) continue;

        if (previousClassId !== undefined) {
          const previousClass = this.lopHanhChinh.find((item) => item.id === previousClassId);
          if (previousClass) previousClass.si_so = Math.max(0, previousClass.si_so - 1);
        }
        student.lop_hanh_chinh = {
          id: lop.id,
          ma_lop: lop.ma_lop,
          ten_lop: lop.ten_lop,
        };
        lop.si_so += 1;
      }
      return ok({ so_luong: studentIds.length }, 'Gán sinh viên vào lớp thành công.');
    }

    const rosterStudent = path.match(/^\/admin-classes\/(\d+)\/students\/(\d+)$/);
    if (rosterStudent && method === 'DELETE') {
      const lopId = Number(rosterStudent[1]);
      const sinhVienId = Number(rosterStudent[2]);
      const student = this.sinhVien.find(
        (sv) => sv.id === sinhVienId && !sv.da_xoa && sv.lop_hanh_chinh?.id === lopId,
      );
      if (!student) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy sinh viên trong lớp.');

      student.lop_hanh_chinh = null;
      const lop = this.lopHanhChinh.find((item) => item.id === lopId);
      if (lop) lop.si_so = Math.max(0, lop.si_so - 1);
      return ok(null, 'Gỡ sinh viên khỏi lớp thành công.');
    }

    // ---------- Giảng viên ----------
    if (path === '/teachers' && method === 'GET') {
      let rows = this.giangVien.filter((r) => !r.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_gv', 'ho_ten', 'email']);
      rows = filterBy(rows, params, ['chuyen_mon', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_gv');
      return paginate(rows, params, '/api/teachers');
    }
    if (path === '/teachers' && method === 'POST') {
      const ketQua = this.chuanHoaGiangVien(body);
      const loiDuLieu = this.loiDuLieuGiangVien(ketQua);
      if (loiDuLieu) return loiDuLieu;

      const giangVien: GiangVien = {
        id: Math.max(0, ...this.giangVien.map((r) => r.id)) + 1,
        ...ketQua.duLieu,
        avatar_url: null,
        da_xoa: false,
      };
      this.giangVien.push(giangVien);
      return ok({ ...giangVien, mat_khau_ban_dau: 'MockGV2026!!' });
    }
    const chiTietGv = path.match(/^\/teachers\/(\d+)$/);
    if (chiTietGv && method === 'GET') {
      const gv = this.giangVien.find((r) => r.id === Number(chiTietGv[1]) && !r.da_xoa);
      return gv ? ok(gv) : loi(MaLoi.NOT_FOUND, 'Không tìm thấy giảng viên.');
    }
    if (chiTietGv && method === 'PUT') {
      const id = Number(chiTietGv[1]);
      const viTri = this.giangVien.findIndex((r) => r.id === id && !r.da_xoa);
      if (viTri === -1) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy giảng viên.');

      const ketQua = this.chuanHoaGiangVien(body, id);
      const loiDuLieu = this.loiDuLieuGiangVien(ketQua);
      if (loiDuLieu) return loiDuLieu;

      this.giangVien[viTri] = { ...this.giangVien[viTri], ...ketQua.duLieu };
      return ok(this.giangVien[viTri], 'Đã cập nhật giảng viên.');
    }
    if (chiTietGv && method === 'DELETE') {
      const id = Number(chiTietGv[1]);
      const viTri = this.giangVien.findIndex((r) => r.id === id && !r.da_xoa);
      if (viTri === -1) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy giảng viên.');

      const loiNghiepVu = this.loiChanXoaGiangVien(id);
      if (loiNghiepVu) return loi(loiNghiepVu.ma_loi, loiNghiepVu.message);

      this.giangVien[viTri] = { ...this.giangVien[viTri], da_xoa: true };
      return ok(null, 'Đã xóa giảng viên.');
    }
    if (path === '/teachers/bulk-status' && method === 'PATCH') {
      return this.hangLoat(this.giangVien, body, (r, trangThai) => ({
        ...r,
        trang_thai: trangThai,
      }));
    }
    if (path === '/teachers/bulk-delete' && method === 'POST') {
      return this.hangLoat(
        this.giangVien,
        body,
        (r) => ({ ...r, da_xoa: true }),
        (r) => this.loiChanXoaGiangVien(r.id),
      );
    }

    // ---------- Môn học ----------
    if (path === '/subjects' && method === 'GET') {
      const soTinChi = params.get('so_tin_chi');
      if (
        soTinChi !== null &&
        (!/^\d+$/.test(soTinChi) || Number(soTinChi) < 1 || Number(soTinChi) > 10)
      ) {
        return loiValidation({
          so_tin_chi: ['Số tín chỉ phải là số nguyên từ 1 đến 10.'],
        });
      }
      let rows = this.monHoc.filter((r) => !r.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_mon', 'ten_mon']);
      rows = filterBy(rows, params, ['khoa_id', 'trang_thai', 'so_tin_chi']);
      rows = sortBy(rows, params, 'ma_mon');
      return paginate(
        rows.map((monHoc) => ({ ...monHoc, khoa: this.khoaRutGon(monHoc.khoa_id) })),
        params,
        '/api/subjects',
      );
    }
    if (path === '/subjects' && method === 'POST') {
      const duLieu = this.chuanHoaMonHoc(body);
      const loiDuLieu = this.loiDuLieuMonHoc(duLieu);
      if (loiDuLieu) return loiDuLieu;

      const monHoc: MonHoc = {
        id: Math.max(0, ...this.monHoc.map((row) => row.id)) + 1,
        ...duLieu.duLieu,
        da_xoa: false,
      };
      this.monHoc.push(monHoc);
      return ok(monHoc, 'Tạo môn học thành công.');
    }

    if (path === '/subjects/bulk-status' && method === 'PATCH') {
      return this.hangLoat(this.monHoc, body, (row, trangThai) => ({
        ...row,
        trang_thai: trangThai,
      }));
    }
    if (path === '/subjects/bulk-delete' && method === 'POST') {
      return this.hangLoat(
        this.monHoc,
        body,
        (row) => ({ ...row, da_xoa: true }),
        (row) => this.loiChanXoaMonHoc(row.id),
      );
    }

    const chiTietMon = path.match(/^\/subjects\/(\d+)$/);
    if (chiTietMon && method === 'GET') {
      const monHoc = this.monHoc.find((row) => row.id === Number(chiTietMon[1]) && !row.da_xoa);
      return monHoc ? ok(monHoc) : loi(MaLoi.NOT_FOUND, 'Không tìm thấy môn học.');
    }
    if (chiTietMon && method === 'PUT') {
      const id = Number(chiTietMon[1]);
      const index = this.monHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy môn học.');

      const duLieu = this.chuanHoaMonHoc(body, id);
      const loiDuLieu = this.loiDuLieuMonHoc(duLieu);
      if (loiDuLieu) return loiDuLieu;
      this.monHoc[index] = { ...this.monHoc[index], ...duLieu.duLieu };
      return ok(this.monHoc[index], 'Cập nhật môn học thành công.');
    }
    if (chiTietMon && method === 'DELETE') {
      const id = Number(chiTietMon[1]);
      const index = this.monHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy môn học.');
      const loiNghiepVu = this.loiChanXoaMonHoc(id);
      if (loiNghiepVu) return loi(loiNghiepVu.ma_loi, loiNghiepVu.message);
      this.monHoc[index] = { ...this.monHoc[index], da_xoa: true };
      return ok(null, 'Xóa môn học thành công.');
    }

    const trangThaiMon = path.match(/^\/subjects\/(\d+)\/status$/);
    if (trangThaiMon && method === 'PATCH') {
      const id = Number(trangThaiMon[1]);
      const index = this.monHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy môn học.');
      const data = this.bodyRecord(body);
      if (typeof data['trang_thai'] !== 'boolean') {
        return loiValidation({ trang_thai: ['Trạng thái không hợp lệ.'] });
      }
      this.monHoc[index] = { ...this.monHoc[index], trang_thai: data['trang_thai'] };
      return ok(this.monHoc[index], 'Cập nhật trạng thái thành công.');
    }

    // ---------- Phòng học ----------
    if (path === '/rooms' && method === 'GET') {
      let rows = this.phongHoc.filter((row) => !row.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_phong', 'ten_phong']);
      rows = filterBy(rows, params, ['trang_thai']);
      rows = sortBy(rows, params, 'ma_phong');
      return paginate(rows, params, '/api/rooms');
    }

    if (path === '/rooms' && method === 'POST') {
      const duLieu = this.chuanHoaPhongHoc(body);
      const loiDuLieu = this.loiDuLieuPhongHoc(duLieu);
      if (loiDuLieu) return loiDuLieu;

      const phongHoc: PhongHoc = {
        id: Math.max(0, ...this.phongHoc.map((row) => row.id)) + 1,
        ...duLieu.duLieu,
        da_xoa: false,
      };
      this.phongHoc.push(phongHoc);
      return ok(phongHoc, 'Tạo phòng học thành công.');
    }

    if (path === '/rooms/bulk-status' && method === 'PATCH') {
      return this.hangLoat(this.phongHoc, body, (row, trangThai) => ({
        ...row,
        trang_thai: trangThai,
      }));
    }
    if (path === '/rooms/bulk-delete' && method === 'POST') {
      return this.hangLoat(
        this.phongHoc,
        body,
        (row) => ({ ...row, da_xoa: true }),
        (row) => this.loiChanXoaPhongHoc(row.id),
      );
    }

    const chiTietPhong = path.match(/^\/rooms\/(\d+)$/);
    if (chiTietPhong && method === 'GET') {
      const phong = this.phongHoc.find((row) => row.id === Number(chiTietPhong[1]) && !row.da_xoa);
      return phong ? ok(phong) : loi(MaLoi.NOT_FOUND, 'Không tìm thấy phòng học.');
    }
    if (chiTietPhong && method === 'PUT') {
      const id = Number(chiTietPhong[1]);
      const index = this.phongHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy phòng học.');

      const duLieu = this.chuanHoaPhongHoc(body, id);
      const loiDuLieu = this.loiDuLieuPhongHoc(duLieu);
      if (loiDuLieu) return loiDuLieu;
      this.phongHoc[index] = { ...this.phongHoc[index], ...duLieu.duLieu };
      return ok(this.phongHoc[index], 'Cập nhật phòng học thành công.');
    }
    if (chiTietPhong && method === 'DELETE') {
      const id = Number(chiTietPhong[1]);
      const index = this.phongHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy phòng học.');
      const loiNghiepVu = this.loiChanXoaPhongHoc(id);
      if (loiNghiepVu) return loi(loiNghiepVu.ma_loi, loiNghiepVu.message);
      this.phongHoc[index] = { ...this.phongHoc[index], da_xoa: true };
      return ok(null, 'Xóa phòng học thành công.');
    }

    const trangThaiPhong = path.match(/^\/rooms\/(\d+)\/status$/);
    if (trangThaiPhong && method === 'PATCH') {
      const id = Number(trangThaiPhong[1]);
      const index = this.phongHoc.findIndex((row) => row.id === id && !row.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy phòng học.');
      const data = this.bodyRecord(body);
      if (typeof data['trang_thai'] !== 'boolean') {
        return loiValidation({ trang_thai: ['Trạng thái không hợp lệ.'] });
      }
      this.phongHoc[index] = { ...this.phongHoc[index], trang_thai: data['trang_thai'] };
      return ok(this.phongHoc[index], 'Cập nhật trạng thái thành công.');
    }

    // ---------- Học kỳ ----------
    if (path === '/semesters' && method === 'GET') {
      let rows = this.hocKy.filter((row) => !this.hocKyDaXoa.has(row.id));
      rows = searchBy(rows, params.get('q'), ['ma_hoc_ky', 'ten_hoc_ky']);
      rows = filterBy(rows, params, ['trang_thai', 'nam_hoc', 'ky_thu']);
      rows = sortBy(rows, params, 'ma_hoc_ky');
      return paginate(rows, params, '/api/semesters');
    }
    if (path === '/semesters' && method === 'POST') {
      const duLieu = this.chuanHoaHocKy(body);
      if (duLieu.loi) return duLieu.loi;
      const hocKy: HocKy = {
        id: Math.max(0, ...this.hocKy.map((row) => row.id)) + 1,
        ...duLieu.giaTri,
        trang_thai: 'UPCOMING',
        dang_mo_dang_ky: false,
      };
      this.hocKy.push(hocKy);
      return ok(hocKy, 'Tạo học kỳ thành công.');
    }

    const doiTrangThaiHocKy = path.match(/^\/semesters\/(\d+)\/status$/);
    if (doiTrangThaiHocKy && method === 'PATCH') {
      const id = Number(doiTrangThaiHocKy[1]);
      const hocKy = this.hocKy.find((row) => row.id === id && !this.hocKyDaXoa.has(row.id));
      if (!hocKy) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy học kỳ.');

      const buocTiepTheo: Partial<Record<TrangThaiHocKy, TrangThaiHocKy>> = {
        UPCOMING: 'ONGOING',
        ONGOING: 'CLOSED',
      };
      const trangThaiTiepTheo = buocTiepTheo[hocKy.trang_thai];
      if (!trangThaiTiepTheo || this.bodyRecord(body)['trang_thai'] !== trangThaiTiepTheo) {
        return loi(
          MaLoi.SEMESTER_TRANSITION_INVALID,
          'Chỉ được chuyển trạng thái theo thứ tự UPCOMING → ONGOING → CLOSED.',
        );
      }
      if (
        trangThaiTiepTheo === 'ONGOING' &&
        this.hocKy.some(
          (row) => row.id !== id && row.trang_thai === 'ONGOING' && !this.hocKyDaXoa.has(row.id),
        )
      ) {
        return loi(MaLoi.SEMESTER_TRANSITION_INVALID, 'Đã có học kỳ khác đang diễn ra.');
      }
      if (trangThaiTiepTheo === 'ONGOING' && !this.system.daLuuCauHinhHocKy(id)) {
        return loi(
          'SEMESTER_CONFIG_REQUIRED',
          'Cần lưu cấu hình điểm của học kỳ trước khi bắt đầu học kỳ.',
        );
      }

      const updated = { ...hocKy, trang_thai: trangThaiTiepTheo };
      this.hocKy = this.hocKy.map((row) => (row.id === id ? updated : row));
      return ok(updated, 'Cập nhật trạng thái học kỳ thành công.');
    }

    const chiTietHocKy = path.match(/^\/semesters\/(\d+)$/);
    if (chiTietHocKy) {
      const id = Number(chiTietHocKy[1]);
      const index = this.hocKy.findIndex((row) => row.id === id && !this.hocKyDaXoa.has(row.id));
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy học kỳ.');

      if (method === 'GET') return ok(this.hocKy[index]);
      if (method === 'PUT') {
        if (this.hocKy[index].trang_thai === 'CLOSED') {
          return loi(MaLoi.SEMESTER_CLOSED, 'Học kỳ đã đóng, chỉ được xem.');
        }
        const duLieu = this.chuanHoaHocKy(body, id);
        if (duLieu.loi) return duLieu.loi;
        const updated = { ...this.hocKy[index], ...duLieu.giaTri };
        this.hocKy[index] = updated;
        return ok(updated, 'Cập nhật học kỳ thành công.');
      }
      if (method === 'DELETE') {
        if (this.hocKy[index].trang_thai !== 'UPCOMING') {
          return loi(MaLoi.DELETE_BLOCKED, 'Chỉ được xóa học kỳ sắp diễn ra.');
        }
        const hasSections = LOP_HOC_PHAN_MOCK.some(
          (section) => section.hoc_ky.id === id && !section.da_xoa,
        );
        if (hasSections) {
          return loi(MaLoi.SEMESTER_HAS_SECTIONS, 'Học kỳ còn lớp học phần chưa xóa.');
        }
        this.hocKyDaXoa.add(id);
        return ok(null, 'Đã xóa học kỳ.');
      }
    }

    // ---------- Options thuộc nhóm đào tạo ----------
    if (path === '/options/admin-classes' && method === 'GET') {
      let rows = this.lopHanhChinh.filter((r) => !r.da_xoa);
      if (params.get('tat_ca') !== '1') rows = rows.filter((r) => r.trang_thai);
      return ok(
        rows.map((r) => ({
          id: r.id,
          label: r.ma_lop,
          khoa_hoc: r.khoa_hoc,
          nganh: r.nganh,
        })),
      );
    }
    if (path === '/options/subjects' && method === 'GET') {
      let rows = this.monHoc.filter((row) => !row.da_xoa);
      if (params.get('tat_ca') !== '1') rows = rows.filter((row) => row.trang_thai);
      return ok(
        rows.map((r) => ({
          id: r.id,
          label: `${r.ma_mon} — ${r.ten_mon}`,
          so_tin_chi: r.so_tin_chi,
        })),
      );
    }
    if (path === '/options/semesters' && method === 'GET') {
      return ok(
        this.hocKy
          .filter((row) => !this.hocKyDaXoa.has(row.id))
          .map((r) => ({
            id: r.id,
            label: r.ten_hoc_ky,
            nam_hoc: r.nam_hoc,
            ngay_bat_dau: r.ngay_bat_dau,
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

  private xuLyKhoaNganh(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown,
  ): object | undefined {
    if (path === '/options/khoa' && method === 'GET') {
      return ok(
        this.khoa
          .filter((khoa) => !khoa.da_xoa && khoa.trang_thai)
          .sort((a, b) => a.ten_khoa.localeCompare(b.ten_khoa))
          .map((khoa) => ({ id: khoa.id, label: khoa.ten_khoa, ma_khoa: khoa.ma_khoa })),
      );
    }

    if (path === '/options/nganh' && method === 'GET') {
      const khoaId = params.get('khoa_id');
      return ok(
        this.nganh
          .filter(
            (nganh) =>
              !nganh.da_xoa &&
              nganh.trang_thai &&
              (khoaId === null || nganh.khoa_id === Number(khoaId)),
          )
          .sort((a, b) => a.ten_nganh.localeCompare(b.ten_nganh))
          .map((nganh) => ({
            id: nganh.id,
            label: nganh.ten_nganh,
            khoa_id: nganh.khoa_id,
            ma_nganh: nganh.ma_nganh,
          })),
      );
    }

    if (path === '/khoa' && method === 'GET') {
      let rows = this.khoa.filter((khoa) => !khoa.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_khoa', 'ten_khoa']);
      rows = filterBy(rows, params, ['trang_thai']);
      rows = sortBy(rows, params, 'ma_khoa');
      return paginate(
        rows.map((khoa) => ({
          ...khoa,
          so_nganh: this.nganh.filter((nganh) => nganh.khoa_id === khoa.id && !nganh.da_xoa).length,
        })),
        params,
        '/api/khoa',
      );
    }

    if (path === '/khoa' && method === 'POST') {
      const data = this.bodyRecord(body);
      const validation = this.chuanHoaKhoa(data);
      if (validation) return validation;
      const khoa: Khoa = {
        id: Math.max(0, ...this.khoa.map((row) => row.id)) + 1,
        ma_khoa: String(data['ma_khoa']).trim(),
        ten_khoa: String(data['ten_khoa']).trim(),
        mo_ta:
          typeof data['mo_ta'] === 'string' && data['mo_ta'].trim() ? data['mo_ta'].trim() : null,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
        so_nganh: 0,
        da_xoa: false,
      };
      this.khoa.push(khoa);
      return ok(khoa, 'Tạo khoa thành công.');
    }

    const khoaMatch = path.match(/^\/khoa\/(\d+)$/);
    if (khoaMatch) {
      const id = Number(khoaMatch[1]);
      const index = this.khoa.findIndex((khoa) => khoa.id === id && !khoa.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy khoa.');
      const khoa = this.khoa[index];
      if (method === 'GET') {
        return ok({
          ...khoa,
          so_nganh: this.nganh.filter((nganh) => nganh.khoa_id === id && !nganh.da_xoa).length,
        });
      }
      if (method === 'PUT') {
        const data = this.bodyRecord(body);
        const validation = this.chuanHoaKhoa(data, id);
        if (validation) return validation;
        this.khoa[index] = {
          ...khoa,
          ma_khoa: String(data['ma_khoa']).trim(),
          ten_khoa: String(data['ten_khoa']).trim(),
          mo_ta:
            typeof data['mo_ta'] === 'string' && data['mo_ta'].trim() ? data['mo_ta'].trim() : null,
          trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
        };
        this.capNhatThamChieuKhoa(id);
        return ok(this.khoa[index], 'Cập nhật khoa thành công.');
      }
      if (method === 'DELETE') {
        const hasNganh = this.nganh.some((nganh) => nganh.khoa_id === id && !nganh.da_xoa);
        const hasMonHoc = this.monHoc.some((monHoc) => monHoc.khoa_id === id && !monHoc.da_xoa);
        if (hasNganh || hasMonHoc) {
          return loi(MaLoi.DELETE_BLOCKED, 'Không thể xóa khoa còn ngành hoặc môn học.');
        }
        this.khoa[index] = { ...khoa, da_xoa: true };
        return ok(null, 'Xóa khoa thành công.');
      }
    }

    if (path === '/nganh' && method === 'GET') {
      let rows = this.nganh.filter((nganh) => !nganh.da_xoa);
      rows = searchBy(rows, params.get('q'), ['ma_nganh', 'ten_nganh']);
      rows = filterBy(rows, params, ['khoa_id', 'trang_thai']);
      rows = sortBy(rows, params, 'ma_nganh');
      return paginate(
        rows.map((nganh) => ({ ...nganh, khoa: this.khoaRutGon(nganh.khoa_id) })),
        params,
        '/api/nganh',
      );
    }

    if (path === '/nganh' && method === 'POST') {
      const data = this.bodyRecord(body);
      const validation = this.chuanHoaNganh(data);
      if (validation) return validation;
      const khoaId = Number(data['khoa_id']);
      const nganh: Nganh = {
        id: Math.max(0, ...this.nganh.map((row) => row.id)) + 1,
        khoa_id: khoaId,
        khoa: this.khoaRutGon(khoaId),
        ma_nganh: String(data['ma_nganh']).trim(),
        ten_nganh: String(data['ten_nganh']).trim(),
        mo_ta:
          typeof data['mo_ta'] === 'string' && data['mo_ta'].trim() ? data['mo_ta'].trim() : null,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
        da_xoa: false,
      };
      this.nganh.push(nganh);
      return ok(nganh, 'Tạo ngành thành công.');
    }

    const nganhMatch = path.match(/^\/nganh\/(\d+)$/);
    if (nganhMatch) {
      const id = Number(nganhMatch[1]);
      const index = this.nganh.findIndex((nganh) => nganh.id === id && !nganh.da_xoa);
      if (index < 0) return loi(MaLoi.NOT_FOUND, 'Không tìm thấy ngành.');
      const nganh = this.nganh[index];
      if (method === 'GET') {
        return ok({ ...nganh, khoa: this.khoaRutGon(nganh.khoa_id) });
      }
      if (method === 'PUT') {
        const data = this.bodyRecord(body);
        const validation = this.chuanHoaNganh(data, id);
        if (validation) return validation;
        const khoaId = Number(data['khoa_id']);
        this.nganh[index] = {
          ...nganh,
          khoa_id: khoaId,
          khoa: this.khoaRutGon(khoaId),
          ma_nganh: String(data['ma_nganh']).trim(),
          ten_nganh: String(data['ten_nganh']).trim(),
          mo_ta:
            typeof data['mo_ta'] === 'string' && data['mo_ta'].trim() ? data['mo_ta'].trim() : null,
          trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
        };
        this.capNhatThamChieuNganh(id);
        return ok(this.nganh[index], 'Cập nhật ngành thành công.');
      }
      if (method === 'DELETE') {
        const hasClass = this.lopHanhChinh.some((lop) => lop.nganh_id === id && !lop.da_xoa);
        const hasTeacher = this.giangVien.some(
          (giangVien) => giangVien.nganh_id === id && !giangVien.da_xoa,
        );
        if (hasClass || hasTeacher) {
          return loi(
            MaLoi.DELETE_BLOCKED,
            'Không thể xóa ngành còn giảng viên hoặc lớp hành chính.',
          );
        }
        this.nganh[index] = { ...nganh, da_xoa: true };
        return ok(null, 'Xóa ngành thành công.');
      }
    }

    return undefined;
  }

  private chuanHoaKhoa(data: Record<string, unknown>, boQuaId?: number): object | null {
    const maKhoa = typeof data['ma_khoa'] === 'string' ? data['ma_khoa'].trim() : '';
    const tenKhoa = typeof data['ten_khoa'] === 'string' ? data['ten_khoa'].trim() : '';
    const errors: Record<string, string[]> = {};
    if (!maKhoa) errors['ma_khoa'] = ['Mã khoa là bắt buộc.'];
    else if (maKhoa.length > 20) errors['ma_khoa'] = ['Mã khoa không được vượt quá 20 ký tự.'];
    if (!tenKhoa) errors['ten_khoa'] = ['Tên khoa là bắt buộc.'];
    else if (tenKhoa.length > 255) errors['ten_khoa'] = ['Tên khoa không được vượt quá 255 ký tự.'];
    if (
      maKhoa &&
      this.khoa.some(
        (khoa) => khoa.id !== boQuaId && khoa.ma_khoa.toLowerCase() === maKhoa.toLowerCase(),
      )
    ) {
      errors['ma_khoa'] = ['Mã khoa này đã tồn tại.'];
    }
    if (
      data['mo_ta'] !== null &&
      data['mo_ta'] !== undefined &&
      typeof data['mo_ta'] !== 'string'
    ) {
      errors['mo_ta'] = ['Mô tả không hợp lệ.'];
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      errors['trang_thai'] = ['Trạng thái không hợp lệ.'];
    }
    return Object.keys(errors).length ? loiValidation(errors) : null;
  }

  private chuanHoaNganh(data: Record<string, unknown>, boQuaId?: number): object | null {
    const khoaId = Number(data['khoa_id']);
    const maNganh = typeof data['ma_nganh'] === 'string' ? data['ma_nganh'].trim() : '';
    const tenNganh = typeof data['ten_nganh'] === 'string' ? data['ten_nganh'].trim() : '';
    const errors: Record<string, string[]> = {};
    if (
      !Number.isInteger(khoaId) ||
      !this.khoa.some((khoa) => khoa.id === khoaId && !khoa.da_xoa)
    ) {
      errors['khoa_id'] = ['Khoa không tồn tại.'];
    }
    if (!maNganh) errors['ma_nganh'] = ['Mã ngành là bắt buộc.'];
    else if (maNganh.length > 20) errors['ma_nganh'] = ['Mã ngành không được vượt quá 20 ký tự.'];
    if (!tenNganh) errors['ten_nganh'] = ['Tên ngành là bắt buộc.'];
    else if (tenNganh.length > 255)
      errors['ten_nganh'] = ['Tên ngành không được vượt quá 255 ký tự.'];
    if (
      maNganh &&
      this.nganh.some(
        (nganh) => nganh.id !== boQuaId && nganh.ma_nganh.toLowerCase() === maNganh.toLowerCase(),
      )
    ) {
      errors['ma_nganh'] = ['Mã ngành này đã tồn tại.'];
    }
    if (
      tenNganh &&
      this.nganh.some(
        (nganh) =>
          nganh.id !== boQuaId &&
          nganh.khoa_id === khoaId &&
          nganh.ten_nganh.toLowerCase() === tenNganh.toLowerCase(),
      )
    ) {
      errors['ten_nganh'] = ['Tên ngành đã tồn tại trong khoa này.'];
    }
    if (
      data['mo_ta'] !== null &&
      data['mo_ta'] !== undefined &&
      typeof data['mo_ta'] !== 'string'
    ) {
      errors['mo_ta'] = ['Mô tả không hợp lệ.'];
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      errors['trang_thai'] = ['Trạng thái không hợp lệ.'];
    }
    return Object.keys(errors).length ? loiValidation(errors) : null;
  }

  private khoaRutGon(id: number | null): KhoaRutGon | null {
    const khoa = id === null ? undefined : this.khoa.find((row) => row.id === id && !row.da_xoa);
    return khoa ? { id: khoa.id, ma_khoa: khoa.ma_khoa, ten_khoa: khoa.ten_khoa } : null;
  }

  private capNhatThamChieuKhoa(khoaId: number): void {
    const khoa = this.khoaRutGon(khoaId);
    this.nganh = this.nganh.map((nganh) => (nganh.khoa_id === khoaId ? { ...nganh, khoa } : nganh));
    this.monHoc = this.monHoc.map((monHoc) =>
      monHoc.khoa_id === khoaId ? { ...monHoc, khoa } : monHoc,
    );
    this.lopHanhChinh = this.lopHanhChinh.map((lop) =>
      lop.nganh?.khoa_id === khoaId ? { ...lop, khoa } : lop,
    );
  }

  private capNhatThamChieuNganh(nganhId: number): void {
    const nganh = this.nganhRutGon(nganhId);
    this.lopHanhChinh = this.lopHanhChinh.map((lop) =>
      lop.nganh_id === nganhId ? { ...lop, nganh, khoa: this.khoaCuaNganh(nganhId) } : lop,
    );
    this.giangVien = this.giangVien.map((giangVien) =>
      giangVien.nganh_id === nganhId ? { ...giangVien, nganh } : giangVien,
    );
  }

  private nganhRutGon(id: number | null): NganhRutGon | null {
    const nganh = id === null ? undefined : this.nganh.find((row) => row.id === id && !row.da_xoa);
    return nganh
      ? {
          id: nganh.id,
          ma_nganh: nganh.ma_nganh,
          ten_nganh: nganh.ten_nganh,
          khoa_id: nganh.khoa_id,
        }
      : null;
  }

  private khoaCuaNganh(id: number | null): KhoaRutGon | null {
    const nganh = id === null ? undefined : this.nganh.find((row) => row.id === id && !row.da_xoa);
    return nganh ? this.khoaRutGon(nganh.khoa_id) : null;
  }

  private chuanHoaLop(
    body: unknown,
    boQuaId?: number,
  ): {
    duLieu: Omit<LopHanhChinh, 'id' | 'si_so' | 'da_xoa'>;
    mo_ta: string | null;
    errors: Record<string, string[]>;
    maLoi: typeof MaLoi.DUPLICATE_CODE | null;
  } {
    const data =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const maLop = typeof data['ma_lop'] === 'string' ? data['ma_lop'].trim() : '';
    const tenLop = typeof data['ten_lop'] === 'string' ? data['ten_lop'].trim() : '';
    const khoaHoc = typeof data['khoa_hoc'] === 'string' ? data['khoa_hoc'].trim() : '';
    const nganhId =
      typeof data['nganh_id'] === 'number' && Number.isInteger(data['nganh_id'])
        ? data['nganh_id']
        : null;
    const moTa = typeof data['mo_ta'] === 'string' ? data['mo_ta'].trim() : '';
    const namNhapHoc =
      data['nam_nhap_hoc'] === null ||
      data['nam_nhap_hoc'] === undefined ||
      data['nam_nhap_hoc'] === ''
        ? null
        : Number(data['nam_nhap_hoc']);
    const errors: Record<string, string[]> = {};
    let maLoi: typeof MaLoi.DUPLICATE_CODE | null = null;
    const themLoi = (field: string, message: string) => {
      errors[field] = [...(errors[field] ?? []), message];
    };

    if (!maLop) themLoi('ma_lop', 'Mã lớp là bắt buộc.');
    else if (maLop.length > 20) themLoi('ma_lop', 'Mã lớp không được vượt quá 20 ký tự.');
    if (!tenLop) themLoi('ten_lop', 'Tên lớp là bắt buộc.');
    else if (tenLop.length > 255) themLoi('ten_lop', 'Tên lớp không được vượt quá 255 ký tự.');
    if (khoaHoc.length > 20) themLoi('khoa_hoc', 'Khóa học không được vượt quá 20 ký tự.');
    if (nganhId !== null && !this.nganh.some((n) => n.id === nganhId && !n.da_xoa)) {
      themLoi('nganh_id', 'Ngành không tồn tại.');
    }
    if (
      namNhapHoc !== null &&
      (!Number.isInteger(namNhapHoc) || namNhapHoc < 1900 || namNhapHoc > 2100)
    ) {
      themLoi('nam_nhap_hoc', 'Năm nhập học phải là số nguyên từ 1900 đến 2100.');
    }
    if (
      maLop &&
      this.lopHanhChinh.some(
        (r) => r.id !== boQuaId && r.ma_lop.toLocaleLowerCase() === maLop.toLocaleLowerCase(),
      )
    ) {
      themLoi('ma_lop', 'Mã lớp này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    return {
      duLieu: {
        ma_lop: maLop,
        ten_lop: tenLop,
        khoa_hoc: khoaHoc || null,
        nganh_id: nganhId,
        nganh: this.nganhRutGon(nganhId),
        khoa: this.khoaCuaNganh(nganhId),
        nam_nhap_hoc: namNhapHoc,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
      },
      mo_ta: moTa || null,
      errors,
      maLoi,
    };
  }

  private demSinhVien(lopId: number): number {
    return this.sinhVien.filter(
      (student) => !student.da_xoa && student.lop_hanh_chinh?.id === lopId,
    ).length;
  }

  private loiDuLieuLop(ketQua: ReturnType<DaoTaoRegistry['chuanHoaLop']>): object | null {
    if (ketQua.maLoi) {
      return loi(MaLoi.DUPLICATE_CODE, 'Mã lớp này đã tồn tại.', ketQua.errors);
    }
    return Object.keys(ketQua.errors).length ? loiValidation(ketQua.errors) : null;
  }

  private chuanHoaSinhVien(
    body: unknown,
    boQuaId?: number,
  ): {
    duLieu: Omit<SinhVien, 'id' | 'lop_hanh_chinh' | 'avatar_url' | 'da_xoa'>;
    lop: LopHanhChinh | null;
    errors: Record<string, string[]>;
    maLoi: typeof MaLoi.DUPLICATE_CODE | typeof MaLoi.DUPLICATE_EMAIL | null;
  } {
    const data =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const maSv = typeof data['ma_sv'] === 'string' ? data['ma_sv'].trim() : '';
    const hoTen = typeof data['ho_ten'] === 'string' ? data['ho_ten'].trim() : '';
    const email = typeof data['email'] === 'string' ? data['email'].trim() : '';
    const soDienThoai =
      typeof data['so_dien_thoai'] === 'string' ? data['so_dien_thoai'].trim() : '';
    const ngaySinh = typeof data['ngay_sinh'] === 'string' ? data['ngay_sinh'] : null;
    const lopId =
      data['lop_hanh_chinh_id'] === null ||
      data['lop_hanh_chinh_id'] === undefined ||
      data['lop_hanh_chinh_id'] === ''
        ? null
        : Number(data['lop_hanh_chinh_id']);
    const errors: Record<string, string[]> = {};
    let maLoi: typeof MaLoi.DUPLICATE_CODE | typeof MaLoi.DUPLICATE_EMAIL | null = null;
    const themLoi = (truong: string, message: string) => {
      errors[truong] = [...(errors[truong] ?? []), message];
    };

    if (!maSv) themLoi('ma_sv', 'Mã sinh viên là bắt buộc.');
    else if (maSv.length > 50) themLoi('ma_sv', 'Mã sinh viên không được vượt quá 50 ký tự.');
    if (!hoTen) themLoi('ho_ten', 'Họ tên là bắt buộc.');
    else if (hoTen.length > 255) themLoi('ho_ten', 'Họ tên không được vượt quá 255 ký tự.');
    if (!email) themLoi('email', 'Email là bắt buộc.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) themLoi('email', 'Email không hợp lệ.');
    else if (
      this.sinhVien.some(
        (r) => r.id !== boQuaId && r.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
      ) ||
      this.giangVien.some((r) => r.email.toLocaleLowerCase() === email.toLocaleLowerCase())
    ) {
      themLoi('email', 'Email này đã được sử dụng.');
      maLoi ??= MaLoi.DUPLICATE_EMAIL;
    }
    if (
      maSv &&
      this.sinhVien.some(
        (r) => r.id !== boQuaId && r.ma_sv.toLocaleLowerCase() === maSv.toLocaleLowerCase(),
      )
    ) {
      themLoi('ma_sv', 'Mã sinh viên này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (soDienThoai.length > 20) {
      themLoi('so_dien_thoai', 'Số điện thoại không được vượt quá 20 ký tự.');
    }
    if (
      data['gioi_tinh'] !== undefined &&
      data['gioi_tinh'] !== null &&
      typeof data['gioi_tinh'] !== 'boolean'
    ) {
      themLoi('gioi_tinh', 'Giới tính không hợp lệ.');
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    const lop =
      lopId === null ? null : (this.lopHanhChinh.find((r) => r.id === lopId && !r.da_xoa) ?? null);
    if (lopId !== null && (!Number.isInteger(lopId) || !lop)) {
      themLoi('lop_hanh_chinh_id', 'Lớp hành chính không hợp lệ.');
    }

    return {
      duLieu: {
        ma_sv: maSv,
        ho_ten: hoTen,
        ngay_sinh: ngaySinh,
        gioi_tinh: typeof data['gioi_tinh'] === 'boolean' ? data['gioi_tinh'] : true,
        email,
        so_dien_thoai: soDienThoai || null,
        dia_chi: typeof data['dia_chi'] === 'string' ? data['dia_chi'].trim() || null : null,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
      },
      lop,
      errors,
      maLoi,
    };
  }

  private loiDuLieuSinhVien(ketQua: ReturnType<DaoTaoRegistry['chuanHoaSinhVien']>): object | null {
    if (ketQua.maLoi) {
      const message =
        ketQua.maLoi === MaLoi.DUPLICATE_CODE
          ? 'Mã sinh viên này đã tồn tại.'
          : 'Email này đã được sử dụng.';
      return loi(ketQua.maLoi, message, ketQua.errors);
    }
    return Object.keys(ketQua.errors).length > 0 ? loiValidation(ketQua.errors) : null;
  }

  private chuanHoaGiangVien(
    body: unknown,
    boQuaId?: number,
  ): {
    duLieu: Omit<GiangVien, 'id' | 'avatar_url' | 'da_xoa'>;
    errors: Record<string, string[]>;
    maLoi: typeof MaLoi.DUPLICATE_CODE | typeof MaLoi.DUPLICATE_EMAIL | null;
  } {
    const data =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const maGv = typeof data['ma_gv'] === 'string' ? data['ma_gv'].trim() : '';
    const hoTen = typeof data['ho_ten'] === 'string' ? data['ho_ten'].trim() : '';
    const email = typeof data['email'] === 'string' ? data['email'].trim() : '';
    const soDienThoai =
      typeof data['so_dien_thoai'] === 'string' ? data['so_dien_thoai'].trim() : '';
    const nganhId =
      typeof data['nganh_id'] === 'number' && Number.isInteger(data['nganh_id'])
        ? data['nganh_id']
        : null;
    const errors: Record<string, string[]> = {};
    let maLoi: typeof MaLoi.DUPLICATE_CODE | typeof MaLoi.DUPLICATE_EMAIL | null = null;
    const themLoi = (field: string, message: string) => {
      errors[field] = [...(errors[field] ?? []), message];
    };

    if (!maGv) themLoi('ma_gv', 'Mã giảng viên là bắt buộc.');
    else if (maGv.length > 50) themLoi('ma_gv', 'Mã giảng viên không được vượt quá 50 ký tự.');
    if (!hoTen) themLoi('ho_ten', 'Họ tên là bắt buộc.');
    else if (hoTen.length > 255) themLoi('ho_ten', 'Họ tên không được vượt quá 255 ký tự.');
    if (!email) themLoi('email', 'Email là bắt buộc.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) themLoi('email', 'Email không hợp lệ.');
    else if (
      this.giangVien.some(
        (r) => r.id !== boQuaId && r.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
      ) ||
      this.sinhVien.some((r) => r.email.toLocaleLowerCase() === email.toLocaleLowerCase())
    ) {
      themLoi('email', 'Email này đã được sử dụng.');
      maLoi = MaLoi.DUPLICATE_EMAIL;
    }
    if (
      maGv &&
      this.giangVien.some(
        (r) => r.id !== boQuaId && r.ma_gv.toLocaleLowerCase() === maGv.toLocaleLowerCase(),
      )
    ) {
      themLoi('ma_gv', 'Mã giảng viên này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (soDienThoai.length > 20) {
      themLoi('so_dien_thoai', 'Số điện thoại không được vượt quá 20 ký tự.');
    }
    if (nganhId !== null && !this.nganh.some((n) => n.id === nganhId && !n.da_xoa)) {
      themLoi('nganh_id', 'Ngành không tồn tại.');
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    return {
      duLieu: {
        ma_gv: maGv,
        ho_ten: hoTen,
        email,
        so_dien_thoai: soDienThoai || null,
        nganh_id: nganhId,
        nganh: this.nganhRutGon(nganhId),
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
      },
      errors,
      maLoi,
    };
  }

  private loiDuLieuGiangVien(
    ketQua: ReturnType<DaoTaoRegistry['chuanHoaGiangVien']>,
  ): object | null {
    if (ketQua.maLoi) {
      const message =
        ketQua.maLoi === MaLoi.DUPLICATE_CODE
          ? 'Mã giảng viên này đã tồn tại.'
          : 'Email này đã được sử dụng.';
      return loi(ketQua.maLoi, message, ketQua.errors);
    }
    return Object.keys(ketQua.errors).length > 0 ? loiValidation(ketQua.errors) : null;
  }

  private chuanHoaMonHoc(
    body: unknown,
    boQuaId?: number,
  ): {
    duLieu: Omit<MonHoc, 'id' | 'da_xoa'>;
    errors: Record<string, string[]>;
    maLoi: typeof MaLoi.DUPLICATE_CODE | null;
  } {
    const data = this.bodyRecord(body);
    const maMon = typeof data['ma_mon'] === 'string' ? data['ma_mon'].trim() : '';
    const tenMon = typeof data['ten_mon'] === 'string' ? data['ten_mon'].trim() : '';
    const khoaId =
      typeof data['khoa_id'] === 'number' && Number.isInteger(data['khoa_id'])
        ? data['khoa_id']
        : null;
    const soTinChi =
      typeof data['so_tin_chi'] === 'number' || typeof data['so_tin_chi'] === 'string'
        ? Number(data['so_tin_chi'])
        : Number.NaN;
    const moTa =
      data['mo_ta'] === null || data['mo_ta'] === undefined
        ? null
        : typeof data['mo_ta'] === 'string'
          ? data['mo_ta'].trim() || null
          : null;
    const errors: Record<string, string[]> = {};
    let maLoi: typeof MaLoi.DUPLICATE_CODE | null = null;
    const themLoi = (field: string, message: string) => {
      errors[field] = [...(errors[field] ?? []), message];
    };

    if (!maMon) themLoi('ma_mon', 'Mã môn là bắt buộc.');
    else if (maMon.length > 20) themLoi('ma_mon', 'Mã môn không được vượt quá 20 ký tự.');
    if (
      maMon &&
      this.monHoc.some(
        (row) => row.id !== boQuaId && row.ma_mon.toLocaleLowerCase() === maMon.toLocaleLowerCase(),
      )
    ) {
      themLoi('ma_mon', 'Mã môn này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (!tenMon) themLoi('ten_mon', 'Tên môn học là bắt buộc.');
    else if (tenMon.length > 255) themLoi('ten_mon', 'Tên môn học không được vượt quá 255 ký tự.');
    if (!Number.isInteger(soTinChi) || soTinChi < 1 || soTinChi > 10) {
      themLoi('so_tin_chi', 'Số tín chỉ phải là số nguyên từ 1 đến 10.');
    }
    if (
      data['mo_ta'] !== null &&
      data['mo_ta'] !== undefined &&
      typeof data['mo_ta'] !== 'string'
    ) {
      themLoi('mo_ta', 'Mô tả không hợp lệ.');
    }
    if (khoaId !== null && !this.khoa.some((k) => k.id === khoaId && !k.da_xoa)) {
      themLoi('khoa_id', 'Khoa không tồn tại.');
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }
    return {
      duLieu: {
        ma_mon: maMon,
        khoa_id: khoaId,
        khoa: this.khoaRutGon(khoaId),
        ten_mon: tenMon,
        so_tin_chi: soTinChi,
        mo_ta: moTa,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
      },
      errors,
      maLoi,
    };
  }

  private loiDuLieuMonHoc(ketQua: ReturnType<DaoTaoRegistry['chuanHoaMonHoc']>): object | null {
    if (ketQua.maLoi) {
      return loi(MaLoi.DUPLICATE_CODE, 'Mã môn này đã tồn tại.', ketQua.errors);
    }
    return Object.keys(ketQua.errors).length > 0 ? loiValidation(ketQua.errors) : null;
  }

  private chuanHoaPhongHoc(
    body: unknown,
    boQuaId?: number,
  ): {
    duLieu: Omit<PhongHoc, 'id' | 'da_xoa'>;
    errors: Record<string, string[]>;
    maLoi: typeof MaLoi.DUPLICATE_CODE | null;
  } {
    const data = this.bodyRecord(body);
    const maPhong = typeof data['ma_phong'] === 'string' ? data['ma_phong'].trim() : '';
    const tenPhong = typeof data['ten_phong'] === 'string' ? data['ten_phong'].trim() : '';
    const sucChua =
      typeof data['suc_chua'] === 'number' || typeof data['suc_chua'] === 'string'
        ? Number(data['suc_chua'])
        : Number.NaN;
    const errors: Record<string, string[]> = {};
    let maLoi: typeof MaLoi.DUPLICATE_CODE | null = null;
    const themLoi = (field: string, message: string) => {
      errors[field] = [...(errors[field] ?? []), message];
    };

    if (!maPhong) themLoi('ma_phong', 'Mã phòng là bắt buộc.');
    else if (maPhong.length > 20) themLoi('ma_phong', 'Mã phòng không được vượt quá 20 ký tự.');
    if (
      maPhong &&
      this.phongHoc.some(
        (row) =>
          row.id !== boQuaId && row.ma_phong.toLocaleLowerCase() === maPhong.toLocaleLowerCase(),
      )
    ) {
      themLoi('ma_phong', 'Mã phòng này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (!tenPhong) themLoi('ten_phong', 'Tên phòng là bắt buộc.');
    else if (tenPhong.length > 255)
      themLoi('ten_phong', 'Tên phòng không được vượt quá 255 ký tự.');
    if (!Number.isInteger(sucChua) || sucChua < 1 || sucChua > 65535) {
      themLoi('suc_chua', 'Sức chứa phải là số nguyên từ 1 đến 65535.');
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    return {
      duLieu: {
        ma_phong: maPhong,
        ten_phong: tenPhong,
        suc_chua: sucChua,
        trang_thai: typeof data['trang_thai'] === 'boolean' ? data['trang_thai'] : true,
      },
      errors,
      maLoi,
    };
  }

  private loiDuLieuPhongHoc(ketQua: ReturnType<DaoTaoRegistry['chuanHoaPhongHoc']>): object | null {
    if (ketQua.maLoi) {
      return loi(MaLoi.DUPLICATE_CODE, 'Mã phòng này đã tồn tại.', ketQua.errors);
    }
    return Object.keys(ketQua.errors).length > 0 ? loiValidation(ketQua.errors) : null;
  }

  private loiChanXoaPhongHoc(
    id: number,
  ): { ma_loi: typeof MaLoi.DELETE_BLOCKED; message: string } | null {
    if (this.phongCoBuoiHocSapToi.has(id)) {
      return {
        ma_loi: MaLoi.DELETE_BLOCKED,
        message: 'Phòng học còn buổi học đã xếp lịch chưa kết thúc.',
      };
    }

    return null;
  }

  private loiChanXoaMonHoc(
    id: number,
  ): { ma_loi: typeof MaLoi.DELETE_BLOCKED; message: string } | null {
    const conLopDangMo = LOP_HOC_PHAN_MOCK.some(
      (lop) => lop.mon_hoc.id === id && !lop.da_xoa && lop.hoc_ky.trang_thai !== 'CLOSED',
    );
    return conLopDangMo
      ? {
          ma_loi: MaLoi.DELETE_BLOCKED,
          message: 'Môn học còn lớp học phần thuộc học kỳ chưa đóng.',
        }
      : null;
  }

  private bodyRecord(body: unknown): Record<string, unknown> {
    return body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  }

  private chuanHoaHocKy(
    body: unknown,
    boQuaId?: number,
  ): { giaTri: Omit<HocKy, 'id' | 'trang_thai' | 'dang_mo_dang_ky'>; loi: object | null } {
    const data = this.bodyRecord(body);
    const maHocKy = typeof data['ma_hoc_ky'] === 'string' ? data['ma_hoc_ky'].trim() : '';
    const tenHocKy = typeof data['ten_hoc_ky'] === 'string' ? data['ten_hoc_ky'].trim() : '';
    const namHoc = typeof data['nam_hoc'] === 'string' ? data['nam_hoc'].trim() : '';
    const kyThu = Number(data['ky_thu']);
    const ngayBatDau = typeof data['ngay_bat_dau'] === 'string' ? data['ngay_bat_dau'] : '';
    const ngayKetThuc = typeof data['ngay_ket_thuc'] === 'string' ? data['ngay_ket_thuc'] : '';
    const moDangKy = typeof data['mo_dang_ky_luc'] === 'string' ? data['mo_dang_ky_luc'] : '';
    const dongDangKy = typeof data['dong_dang_ky_luc'] === 'string' ? data['dong_dang_ky_luc'] : '';
    const errors: Record<string, string[]> = {};

    if (!maHocKy) errors['ma_hoc_ky'] = ['Mã học kỳ là bắt buộc.'];
    else if (maHocKy.length > 20) errors['ma_hoc_ky'] = ['Mã học kỳ không được vượt quá 20 ký tự.'];
    if (!tenHocKy) errors['ten_hoc_ky'] = ['Tên học kỳ là bắt buộc.'];
    else if (tenHocKy.length > 255)
      errors['ten_hoc_ky'] = ['Tên học kỳ không được vượt quá 255 ký tự.'];
    const nam = /^\d{4}-\d{4}$/.test(namHoc);
    if (!nam) errors['nam_hoc'] = ['Năm học cần theo dạng YYYY-YYYY.'];
    else {
      const [batDau, ketThuc] = namHoc.split('-').map(Number);
      if (ketThuc !== batDau + 1)
        errors['nam_hoc'] = ['Năm học kết thúc phải bằng năm bắt đầu cộng 1.'];
    }
    if (!Number.isInteger(kyThu) || kyThu < 1 || kyThu > 3) {
      errors['ky_thu'] = ['Kỳ thứ phải là 1, 2 hoặc 3.'];
    }
    if (!this.laNgayIso(ngayBatDau)) errors['ngay_bat_dau'] = ['Ngày bắt đầu không hợp lệ.'];
    if (!this.laNgayIso(ngayKetThuc)) errors['ngay_ket_thuc'] = ['Ngày kết thúc không hợp lệ.'];
    if (ngayBatDau && ngayKetThuc && ngayBatDau >= ngayKetThuc) {
      errors['ngay_ket_thuc'] = ['Ngày kết thúc phải sau ngày bắt đầu.'];
    }
    if (!this.laNgayGioSql(moDangKy))
      errors['mo_dang_ky_luc'] = ['Thời gian mở đăng ký không hợp lệ.'];
    if (!this.laNgayGioSql(dongDangKy))
      errors['dong_dang_ky_luc'] = ['Thời gian đóng đăng ký không hợp lệ.'];
    if (moDangKy && dongDangKy && moDangKy >= dongDangKy) {
      errors['dong_dang_ky_luc'] = ['Thời gian đóng đăng ký phải sau thời gian mở.'];
    }
    if (
      this.laNgayIso(ngayBatDau) &&
      this.laNgayIso(ngayKetThuc) &&
      this.laNgayGioSql(moDangKy) &&
      this.laNgayGioSql(dongDangKy)
    ) {
      if (moDangKy.slice(0, 10) < ngayBatDau || moDangKy.slice(0, 10) > ngayKetThuc) {
        errors['mo_dang_ky_luc'] = ['Thời gian mở đăng ký phải nằm trong thời gian học kỳ.'];
      }
      if (dongDangKy.slice(0, 10) < ngayBatDau || dongDangKy.slice(0, 10) > ngayKetThuc) {
        errors['dong_dang_ky_luc'] = ['Thời gian đóng đăng ký phải nằm trong thời gian học kỳ.'];
      }
    }

    const trungMa = this.hocKy.some(
      (row) => row.id !== boQuaId && row.ma_hoc_ky.toLowerCase() === maHocKy.toLowerCase(),
    );
    if (maHocKy && trungMa) errors['ma_hoc_ky'] = ['Mã học kỳ đã tồn tại.'];

    const trungKy = this.hocKy.some(
      (row) => row.id !== boQuaId && row.nam_hoc === namHoc && row.ky_thu === kyThu,
    );
    if (nam && Number.isInteger(kyThu) && trungKy) {
      errors['ky_thu'] = ['Học kỳ này đã tồn tại trong năm học đã chọn.'];
    }

    const biChong = this.hocKy.some(
      (row) =>
        row.id !== boQuaId &&
        !this.hocKyDaXoa.has(row.id) &&
        this.laNgayIso(ngayBatDau) &&
        this.laNgayIso(ngayKetThuc) &&
        ngayBatDau <= row.ngay_ket_thuc &&
        ngayKetThuc >= row.ngay_bat_dau,
    );
    if (biChong) {
      return {
        giaTri: {
          ma_hoc_ky: maHocKy,
          ten_hoc_ky: tenHocKy,
          nam_hoc: namHoc,
          ky_thu: kyThu,
          ngay_bat_dau: ngayBatDau,
          ngay_ket_thuc: ngayKetThuc,
          mo_dang_ky_luc: moDangKy,
          dong_dang_ky_luc: dongDangKy,
        },
        loi: loi(MaLoi.SEMESTER_OVERLAP, 'Thời gian học kỳ bị chồng lấn với học kỳ khác.'),
      };
    }

    if (Object.keys(errors).length > 0) {
      return {
        giaTri: {
          ma_hoc_ky: maHocKy,
          ten_hoc_ky: tenHocKy,
          nam_hoc: namHoc,
          ky_thu: kyThu,
          ngay_bat_dau: ngayBatDau,
          ngay_ket_thuc: ngayKetThuc,
          mo_dang_ky_luc: moDangKy,
          dong_dang_ky_luc: dongDangKy,
        },
        loi: loiValidation(errors),
      };
    }

    return {
      giaTri: {
        ma_hoc_ky: maHocKy,
        ten_hoc_ky: tenHocKy,
        nam_hoc: namHoc,
        ky_thu: kyThu,
        ngay_bat_dau: ngayBatDau,
        ngay_ket_thuc: ngayKetThuc,
        mo_dang_ky_luc: moDangKy,
        dong_dang_ky_luc: dongDangKy,
      },
      loi: null,
    };
  }

  private laNgayIso(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  private laNgayGioSql(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(value)) return false;
    const [day, time] = value.split(' ');
    return this.laNgayIso(day) && !Number.isNaN(Date.parse(`${day}T${time}`));
  }

  private loiChanXoaGiangVien(
    id: number,
  ): { ma_loi: typeof MaLoi.DELETE_BLOCKED; message: string } | null {
    const conLopDangMo = LOP_HOC_PHAN_MOCK.some(
      (lop) => lop.giang_vien.id === id && !lop.da_xoa && lop.hoc_ky.trang_thai !== 'CLOSED',
    );
    return conLopDangMo
      ? {
          ma_loi: MaLoi.DELETE_BLOCKED,
          message: 'Giảng viên còn phụ trách lớp học phần thuộc học kỳ chưa đóng.',
        }
      : null;
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
    kiemTra?: (row: T) => { ma_loi: string; message: string } | null,
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
      const loiNghiepVu = kiemTra?.(nguon[viTri]);
      if (loiNghiepVu) {
        chiTiet.push({
          id,
          ket_qua: 'THAT_BAI',
          ma_loi: loiNghiepVu.ma_loi,
          message: loiNghiepVu.message,
        });
        continue;
      }
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
