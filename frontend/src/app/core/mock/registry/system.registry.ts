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
import { NguoiDungQuanTri, NguoiDungTaoMoi } from '@core/services/nguoi-dung.service';

const CAU_HINH_MAC_DINH: CauHinhDiem = {
  'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
  'diem.bang_quy_doi': [
    { tu: 8.5, den: 10, chu: 'A', he_4: 4, dat: true },
    { tu: 7, den: 8.49, chu: 'B', he_4: 3, dat: true },
    { tu: 5.5, den: 6.99, chu: 'C', he_4: 2, dat: true },
    { tu: 4, den: 5.49, chu: 'D', he_4: 1, dat: true },
    { tu: 0, den: 3.99, chu: 'F', he_4: 0, dat: false },
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

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
    vaiTro: string | null = null,
  ): object | undefined {
    if (path === '/settings' || path.startsWith('/users')) {
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản trị hệ thống.');
    }

    if (path === '/settings' && method === 'GET') return ok(structuredClone(this.cauHinh));
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
    if (Object.keys(input).length === 0) {
      return loiValidation({ settings: ['Cần gửi object cấu hình có ít nhất một khóa.'] });
    }
    const candidate: CauHinhDiem = structuredClone(this.cauHinh);
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
    Object.assign(this.cauHinh, structuredClone(input));
    return ok(structuredClone(this.cauHinh), 'Cập nhật cấu hình thành công.');
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
