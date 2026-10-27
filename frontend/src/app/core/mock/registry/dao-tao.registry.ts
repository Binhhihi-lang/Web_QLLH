import { HttpParams } from '@angular/common/http';
import { GiangVien, LopHanhChinh, SinhVien } from '@core/models/dao-tao.model';
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
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';

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
  private moTaLop = new Map<number, string | null>();
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

    if (path === '/students' && method === 'POST') {
      const ketQua = this.chuanHoaSinhVien(body);
      const loiDuLieu = this.loiDuLieuSinhVien(ketQua);
      if (loiDuLieu) return loiDuLieu;

      const lop = ketQua.lop;
      const sinhVien: SinhVien = {
        id: Math.max(0, ...this.sinhVien.map((r) => r.id)) + 1,
        ...ketQua.duLieu,
        lop_hanh_chinh: lop
          ? { id: lop.id, ma_lop: lop.ma_lop, ten_lop: lop.ten_lop }
          : null,
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
        lop_hanh_chinh: lop
          ? { id: lop.id, ma_lop: lop.ma_lop, ten_lop: lop.ten_lop }
          : null,
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
      let rows = this.sinhVien.filter(
        (r) => !r.da_xoa && r.lop_hanh_chinh?.id === lopId,
      );
      rows = searchBy(rows, params.get('q'), ['ma_sv', 'ho_ten', 'email']);
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

  private chuanHoaLop(body: unknown, boQuaId?: number): {
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
    const nganh = typeof data['nganh'] === 'string' ? data['nganh'].trim() : '';
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
    if (nganh.length > 20) themLoi('nganh', 'Ngành không được vượt quá 20 ký tự.');
    if (
      namNhapHoc !== null &&
      (!Number.isInteger(namNhapHoc) || namNhapHoc < 1900 || namNhapHoc > 2100)
    ) {
      themLoi('nam_nhap_hoc', 'Năm nhập học phải là số nguyên từ 1900 đến 2100.');
    }
    if (
      maLop &&
      this.lopHanhChinh.some(
        (r) =>
          r.id !== boQuaId && r.ma_lop.toLocaleLowerCase() === maLop.toLocaleLowerCase(),
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
        nganh: nganh || null,
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

  private loiDuLieuLop(
    ketQua: ReturnType<DaoTaoRegistry['chuanHoaLop']>,
  ): object | null {
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
        (r) =>
          r.id !== boQuaId &&
          r.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
      ) ||
      this.giangVien.some((r) => r.email.toLocaleLowerCase() === email.toLocaleLowerCase())
    ) {
      themLoi('email', 'Email này đã được sử dụng.');
      maLoi ??= MaLoi.DUPLICATE_EMAIL;
    }
    if (
      maSv &&
      this.sinhVien.some((r) => r.id !== boQuaId && r.ma_sv.toLocaleLowerCase() === maSv.toLocaleLowerCase())
    ) {
      themLoi('ma_sv', 'Mã sinh viên này đã tồn tại.');
      maLoi = MaLoi.DUPLICATE_CODE;
    }
    if (soDienThoai.length > 20) {
      themLoi('so_dien_thoai', 'Số điện thoại không được vượt quá 20 ký tự.');
    }
    if (data['gioi_tinh'] !== undefined && data['gioi_tinh'] !== null && typeof data['gioi_tinh'] !== 'boolean') {
      themLoi('gioi_tinh', 'Giới tính không hợp lệ.');
    }
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    const lop =
      lopId === null ? null : this.lopHanhChinh.find((r) => r.id === lopId && !r.da_xoa) ?? null;
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

  private loiDuLieuSinhVien(
    ketQua: ReturnType<DaoTaoRegistry['chuanHoaSinhVien']>,
  ): object | null {
    if (ketQua.maLoi) {
      const message =
        ketQua.maLoi === MaLoi.DUPLICATE_CODE
          ? 'Mã sinh viên này đã tồn tại.'
          : 'Email này đã được sử dụng.';
      return loi(ketQua.maLoi, message, ketQua.errors);
    }
    return Object.keys(ketQua.errors).length > 0 ? loiValidation(ketQua.errors) : null;
  }

  private chuanHoaGiangVien(body: unknown, boQuaId?: number): {
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
    const chuyenMon = typeof data['chuyen_mon'] === 'string' ? data['chuyen_mon'].trim() : '';
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
    if (data['trang_thai'] !== undefined && typeof data['trang_thai'] !== 'boolean') {
      themLoi('trang_thai', 'Trạng thái không hợp lệ.');
    }

    return {
      duLieu: {
        ma_gv: maGv,
        ho_ten: hoTen,
        email,
        so_dien_thoai: soDienThoai || null,
        chuyen_mon: chuyenMon || null,
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

  private loiChanXoaGiangVien(
    id: number,
  ): { ma_loi: typeof MaLoi.DELETE_BLOCKED; message: string } | null {
    const conLopDangMo = LOP_HOC_PHAN_MOCK.some(
      (lop) =>
        lop.giang_vien.id === id &&
        !lop.da_xoa &&
        lop.hoc_ky.trang_thai !== 'CLOSED',
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
