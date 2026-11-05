import { HttpParams } from '@angular/common/http';
import {
  CauHinhDiem,
  laKhoangQuyDoiDiem,
  laTrongSoDiem,
  kiemTraCauHinhDiem,
} from '@core/models/he-thong.model';
import {
  filterBy,
  loi,
  loiValidation,
  ok,
  paginate,
  searchBy,
  sortBy,
} from '@core/mock/mock-response';
import { HOC_KY_MOCK } from '@core/mock/data/dao-tao.mock';
import { NguoiDungQuanTri, NguoiDungTaoMoi } from '@core/services/nguoi-dung.service';

const CAU_HINH_MAC_DINH: CauHinhDiem = {
  'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
  'diem.bang_quy_doi': [
    { tu: 8.5, den: 10, chu: 'A', he_4: 4, xep_loai: 'Giỏi', dat: true },
    { tu: 8, den: 8.49, chu: 'B+', he_4: 3.5, xep_loai: 'Khá giỏi', dat: true },
    { tu: 7, den: 7.99, chu: 'B', he_4: 3, xep_loai: 'Khá', dat: true },
    { tu: 6.5, den: 6.99, chu: 'C+', he_4: 2.5, xep_loai: 'Trung bình khá', dat: true },
    { tu: 5.5, den: 6.49, chu: 'C', he_4: 2, xep_loai: 'Trung bình', dat: true },
    { tu: 5, den: 5.49, chu: 'D+', he_4: 1.5, xep_loai: 'Trung bình yếu', dat: true },
    { tu: 4, den: 4.99, chu: 'D', he_4: 1, xep_loai: 'Yếu', dat: true },
    { tu: 0, den: 3.99, chu: 'F', he_4: 0, xep_loai: 'Kém (không đạt)', dat: false },
  ],
  'diem.diem_danh.sua_trong_so_ngay': 7,
};

const NGUOI_DUNG_MAC_DINH: NguoiDungQuanTri[] = [
  {
    id: 1,
    name: 'Quản trị viên',
    email: 'admin@qllh.test',
    avatar_url: null,
    vai_tro: 'ADMIN',
    trang_thai: true,
    must_change_password: false,
    ho_so: null,
  },
  {
    id: 2,
    name: 'Nguyễn Minh An',
    email: 'gv0001@university.edu.vn',
    avatar_url: null,
    vai_tro: 'GIANG_VIEN',
    trang_thai: true,
    must_change_password: false,
    ho_so: { loai: 'giang_vien', id: 1, ma_gv: 'GV0001', ho_ten: 'Nguyễn Minh An' },
  },
  {
    id: 3,
    name: 'Trần Thị Bình',
    email: '2000000@university.edu.vn',
    avatar_url: null,
    vai_tro: 'SINH_VIEN',
    trang_thai: true,
    must_change_password: false,
    ho_so: { loai: 'sinh_vien', id: 1, ma_sv: '2000000', ho_ten: 'Trần Thị Bình' },
  },
];

export class SystemRegistry {
  private readonly nguoiDung = NGUOI_DUNG_MAC_DINH.map((user) => structuredClone(user));
  private readonly cauHinh: CauHinhDiem = structuredClone(CAU_HINH_MAC_DINH);
  private readonly cauHinhTheoHocKy = new Map<number, CauHinhDiem>();

  constructor() {
    // Kỳ đang diễn ra phải có cấu hình đã được chốt trước khi chuyển trạng thái.
    for (const hocKy of HOC_KY_MOCK.filter((row) => row.trang_thai === 'ONGOING')) {
      this.cauHinhTheoHocKy.set(hocKy.id, structuredClone(this.cauHinh));
    }
  }

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
    vaiTro: string | null = null,
  ): object | undefined {
    if (path.startsWith('/settings') || path.startsWith('/users')) {
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản trị hệ thống.');
    }

    if (path === '/settings/semesters' && method === 'GET') return this.danhSachHocKy();
    if (path === '/settings' && method === 'GET') return this.layCauHinh(params);
    if (path === '/settings' && method === 'PUT') return this.capNhatCauHinh(body);
    if (path === '/users' && method === 'GET') return this.layDanhSachNguoiDung(params);
    if (path === '/users' && method === 'POST') return this.taoNguoiDung(body);
    if (path === '/users/bulk-status' && method === 'PATCH')
      return this.capNhatTrangThaiHangLoat(body);

    const action = path.match(/^\/users\/(\d+)(?:\/(status|reset-password))?$/);
    if (!action) return undefined;
    const id = Number(action[1]);
    const index = this.nguoiDung.findIndex((user) => user.id === id);
    if (index < 0) return loi('NOT_FOUND', 'Không tìm thấy người dùng.');

    if (method === 'GET' && !action[2]) return ok(structuredClone(this.nguoiDung[index]));
    if (method === 'PUT' && !action[2]) return this.capNhatNguoiDung(index, body);
    if (method === 'DELETE' && !action[2]) return this.xoaNguoiDung(index);
    if (method === 'PATCH' && action[2] === 'status') return this.capNhatTrangThai(index, body);
    if (method === 'POST' && action[2] === 'reset-password') {
      const user = this.nguoiDung[index];
      user.must_change_password = true;
      return ok(
        { ...structuredClone(user), mat_khau_moi: 'QllhTamThoi2026!' },
        'Đặt lại mật khẩu thành công.',
      );
    }
    return undefined;
  }

  layCauHinhDiem(hocKyId?: number): CauHinhDiem {
    const config = hocKyId === undefined ? this.cauHinh : this.layCauHinhTheoHocKy(hocKyId);
    return structuredClone(config);
  }

  daLuuCauHinhHocKy(hocKyId: number): boolean {
    return this.cauHinhTheoHocKy.has(hocKyId);
  }

  private layCauHinh(params: HttpParams): object {
    const hocKyId = Number(params.get('hoc_ky_id'));
    if (!Number.isInteger(hocKyId) || hocKyId <= 0) {
      return ok(structuredClone(this.cauHinh));
    }

    const hocKy = HOC_KY_MOCK.find((row) => row.id === hocKyId);
    if (!hocKy) return loi('NOT_FOUND', 'Không tìm thấy học kỳ.');
    const config = this.cauHinhTheoHocKy.get(hocKyId);
    const selected = {
      ...(config ?? this.cauHinh),
      'diem.cau_hinh_hoc_ky': config
        ? {
            id: hocKyId,
            hoc_ky_id: hocKyId,
            quy_tac_lam_tron: 'HALF_UP_2',
          }
        : null,
    };
    return ok(structuredClone(selected));
  }

  private danhSachHocKy(): object {
    return ok(
      HOC_KY_MOCK.map((row) => ({
        id: row.id,
        ma_hoc_ky: row.ma_hoc_ky,
        label: row.ten_hoc_ky,
        nam_hoc: row.nam_hoc,
        ky_thu: row.ky_thu,
        ngay_bat_dau: row.ngay_bat_dau,
        ngay_ket_thuc: row.ngay_ket_thuc,
        mo_dang_ky_luc: row.mo_dang_ky_luc,
        dong_dang_ky_luc: row.dong_dang_ky_luc,
        trang_thai: row.trang_thai,
        cau_hinh_da_luu: this.cauHinhTheoHocKy.has(row.id),
      })),
    );
  }

  private layCauHinhTheoHocKy(hocKyId: number): CauHinhDiem {
    const hocKy = HOC_KY_MOCK.find((row) => row.id === hocKyId);
    if (!hocKy) throw new Error('Không tìm thấy học kỳ cấu hình điểm mock.');
    const result = this.layCauHinh(new HttpParams().set('hoc_ky_id', hocKyId));
    if (!('data' in result) || typeof result.data !== 'object' || result.data === null) {
      throw new Error('Không đọc được cấu hình điểm mock theo học kỳ.');
    }
    const data = result.data as Record<string, unknown>;
    if (
      !laTrongSoDiem(data['diem.trong_so']) ||
      !Array.isArray(data['diem.bang_quy_doi']) ||
      !data['diem.bang_quy_doi'].every(laKhoangQuyDoiDiem)
    ) {
      throw new Error('Cấu hình điểm mock theo học kỳ không hợp lệ.');
    }
    return {
      ...this.cauHinh,
      'diem.trong_so': data['diem.trong_so'],
      'diem.bang_quy_doi': data['diem.bang_quy_doi'],
      'diem.diem_danh.sua_trong_so_ngay':
        typeof data['diem.diem_danh.sua_trong_so_ngay'] === 'number'
          ? data['diem.diem_danh.sua_trong_so_ngay']
          : this.cauHinh['diem.diem_danh.sua_trong_so_ngay'],
    };
  }

  private layDanhSachNguoiDung(params: HttpParams): object {
    let rows = searchBy(this.nguoiDung, params.get('q'), ['name', 'email']);
    rows = filterBy(rows, params, ['vai_tro', 'trang_thai']);
    rows = sortBy(rows, params, 'id');
    return paginate(
      rows.map((user) => structuredClone(user)),
      params,
      '/api/users',
    );
  }

  private taoNguoiDung(body: unknown): object {
    const duLieu = this.docLieu(body);
    const loiInput = this.kiemTraNguoiDung(duLieu, true);
    if (Object.keys(loiInput).length) return loiValidation(loiInput);
    if (
      this.nguoiDung.some(
        (user) => user.email.toLowerCase() === String(duLieu['email']).toLowerCase(),
      )
    ) {
      return loiValidation({ email: ['Email đã được sử dụng.'] });
    }

    const user: NguoiDungTaoMoi = {
      id: Math.max(0, ...this.nguoiDung.map((row) => row.id)) + 1,
      name: String(duLieu['name']),
      email: String(duLieu['email']),
      avatar_url: null,
      vai_tro: duLieu['vai_tro'] as NguoiDungQuanTri['vai_tro'],
      trang_thai: typeof duLieu['trang_thai'] === 'boolean' ? duLieu['trang_thai'] : true,
      must_change_password: true,
      ho_so: null,
      mat_khau_ban_dau: 'QllhTamThoi2026!',
    };
    const { mat_khau_ban_dau: _, ...nguoiDung } = user;
    this.nguoiDung.push(nguoiDung);
    return ok(user, 'Tạo tài khoản thành công.');
  }

  private capNhatNguoiDung(index: number, body: unknown): object {
    const duLieu = this.docLieu(body);
    const errors = this.kiemTraNguoiDung(duLieu, false);
    if (Object.keys(errors).length) return loiValidation(errors);
    if (
      this.nguoiDung.some(
        (user, rowIndex) =>
          rowIndex !== index && user.email.toLowerCase() === String(duLieu['email']).toLowerCase(),
      )
    ) {
      return loiValidation({ email: ['Email đã được sử dụng.'] });
    }

    const user = this.nguoiDung[index];
    this.nguoiDung[index] = {
      ...user,
      name: String(duLieu['name']),
      email: String(duLieu['email']),
      vai_tro: duLieu['vai_tro'] as NguoiDungQuanTri['vai_tro'],
      trang_thai:
        typeof duLieu['trang_thai'] === 'boolean' ? duLieu['trang_thai'] : user.trang_thai,
    };
    return ok(structuredClone(this.nguoiDung[index]), 'Cập nhật tài khoản thành công.');
  }

  private xoaNguoiDung(index: number): object {
    if (this.nguoiDung[index].vai_tro !== 'ADMIN') {
      return loi(
        'DELETE_BLOCKED',
        'Chỉ xóa được tài khoản quản trị. Tài khoản giảng viên/sinh viên xóa ở màn tương ứng.',
      );
    }
    this.nguoiDung.splice(index, 1);
    return ok(null, 'Xóa tài khoản thành công.');
  }

  private capNhatTrangThai(index: number, body: unknown): object {
    const trangThai = this.docLieu(body)['trang_thai'];
    if (typeof trangThai !== 'boolean')
      return loiValidation({ trang_thai: ['Trạng thái không hợp lệ.'] });
    this.nguoiDung[index].trang_thai = trangThai;
    return ok(structuredClone(this.nguoiDung[index]));
  }

  private capNhatTrangThaiHangLoat(body: unknown): object {
    const input = this.docLieu(body);
    if (!Array.isArray(input['ids']) || typeof input['trang_thai'] !== 'boolean') {
      return loiValidation({ ids: ['Danh sách tài khoản hoặc trạng thái không hợp lệ.'] });
    }
    const chiTiet = input['ids'].map((rawId) => {
      const user = this.nguoiDung.find((row) => row.id === Number(rawId));
      if (!user)
        return {
          id: Number(rawId),
          ket_qua: 'THAT_BAI',
          ma_loi: 'NOT_FOUND',
          message: 'Không tìm thấy người dùng.',
        };
      user.trang_thai = input['trang_thai'] as boolean;
      return { id: user.id, ket_qua: 'THANH_CONG' };
    });
    const thanhCong = chiTiet.filter((row) => row.ket_qua === 'THANH_CONG').length;
    return ok({
      thanh_cong: thanhCong,
      that_bai: chiTiet.length - thanhCong,
      chi_tiet: chiTiet,
    });
  }

  private capNhatCauHinh(body: unknown): object {
    const input = this.docLieu(body);
    const hocKyId = Number(input['hoc_ky_id']);
    const hocKy = HOC_KY_MOCK.find((row) => row.id === hocKyId);
    if (!hocKy) return loiValidation({ hoc_ky_id: ['Cần chọn học kỳ hợp lệ.'] });
    if (hocKy.trang_thai !== 'UPCOMING') {
      return loi('SEMESTER_CONFIG_LOCKED', 'Chỉ được sửa cấu hình của học kỳ sắp diễn ra.');
    }
    const candidate: CauHinhDiem = structuredClone(
      this.cauHinhTheoHocKy.get(hocKyId) ?? this.cauHinh,
    );
    if (Object.prototype.hasOwnProperty.call(input, 'diem.trong_so')) {
      if (!laTrongSoDiem(input['diem.trong_so'])) {
        return loiValidation({ 'diem.trong_so': ['Trọng số không đúng định dạng.'] });
      }
      candidate['diem.trong_so'] = input['diem.trong_so'];
    }
    if (Object.prototype.hasOwnProperty.call(input, 'diem.bang_quy_doi')) {
      if (
        !Array.isArray(input['diem.bang_quy_doi']) ||
        !input['diem.bang_quy_doi'].every(laKhoangQuyDoiDiem)
      ) {
        return loiValidation({ 'diem.bang_quy_doi': ['Bảng quy đổi không đúng định dạng.'] });
      }
      candidate['diem.bang_quy_doi'] = input['diem.bang_quy_doi'];
    }
    if (Object.prototype.hasOwnProperty.call(input, 'diem.diem_danh.sua_trong_so_ngay')) {
      const days = input['diem.diem_danh.sua_trong_so_ngay'];
      if (typeof days !== 'number') {
        return loiValidation({
          'diem.diem_danh.sua_trong_so_ngay': ['Số ngày không đúng định dạng.'],
        });
      }
      candidate['diem.diem_danh.sua_trong_so_ngay'] = days;
    }
    const allErrors = kiemTraCauHinhDiem(candidate);
    const errors = Object.fromEntries(
      Object.entries(allErrors).filter(([key]) => Object.prototype.hasOwnProperty.call(input, key)),
    );
    if (Object.keys(errors).length) {
      return loiValidation(
        Object.fromEntries(Object.entries(errors).map(([key, message]) => [key, [message]])),
      );
    }

    this.cauHinhTheoHocKy.set(hocKyId, structuredClone(candidate));
    const result = this.layCauHinh(new HttpParams().set('hoc_ky_id', hocKyId));
    return 'data' in result ? ok(result.data, 'Lưu cấu hình học kỳ thành công.') : result;
  }

  private kiemTraNguoiDung(
    input: Record<string, unknown>,
    batBuoc: boolean,
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const field of ['name', 'email', 'vai_tro']) {
      const value = input[field];
      if (batBuoc && (typeof value !== 'string' || value.trim() === '')) {
        errors[field] = ['Trường này là bắt buộc.'];
      }
    }
    if (
      input['name'] !== undefined &&
      (typeof input['name'] !== 'string' || input['name'].length > 255)
    ) {
      errors['name'] = ['Tên không hợp lệ.'];
    }
    if (
      input['email'] !== undefined &&
      (typeof input['email'] !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input['email']))
    ) {
      errors['email'] = ['Email không hợp lệ.'];
    }
    if (
      input['vai_tro'] !== undefined &&
      !['ADMIN', 'GIANG_VIEN', 'SINH_VIEN'].includes(String(input['vai_tro']))
    ) {
      errors['vai_tro'] = ['Vai trò không hợp lệ.'];
    }
    if (input['trang_thai'] !== undefined && typeof input['trang_thai'] !== 'boolean') {
      errors['trang_thai'] = ['Trạng thái không hợp lệ.'];
    }
    return errors;
  }

  private docLieu(body: unknown): Record<string, unknown> {
    return body !== null && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  }
}
