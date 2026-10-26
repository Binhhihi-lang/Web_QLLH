import { SINH_VIEN_MOCK, GIANG_VIEN_MOCK } from '@core/mock/data/dao-tao.mock';
import { ApiResponse, loi, loiValidation, ok } from '@core/mock/mock-response';
import { NguoiDung, VaiTro } from '@core/models/dao-tao.model';

interface TaiKhoanMock {
  vaiTro: VaiTro;
  taiKhoan: string;
  matKhau: string;
  nguoiDung: NguoiDung;
}

export const TAI_KHOAN_DANG_NHAP_MOCK = [
  { vaiTro: 'ADMIN', taiKhoan: 'admin@qllh.test', matKhau: 'QllhMock2026!' },
  {
    vaiTro: 'GIANG_VIEN',
    taiKhoan: GIANG_VIEN_MOCK[0].email,
    matKhau: 'QllhMock2026!',
  },
  { vaiTro: 'SINH_VIEN', taiKhoan: SINH_VIEN_MOCK[0].ma_sv, matKhau: 'QllhMock2026!' },
] as const;

const NGUOI_DUNG_MOCK: NguoiDung[] = [
  {
    id: 1,
    name: 'Quản trị viên',
    email: TAI_KHOAN_DANG_NHAP_MOCK[0].taiKhoan,
    avatar_url: null,
    vai_tro: 'ADMIN',
    trang_thai: true,
    must_change_password: false,
    ho_so: null,
  },
  {
    id: 2,
    name: GIANG_VIEN_MOCK[0].ho_ten,
    email: GIANG_VIEN_MOCK[0].email,
    avatar_url: GIANG_VIEN_MOCK[0].avatar_url,
    vai_tro: 'GIANG_VIEN',
    trang_thai: GIANG_VIEN_MOCK[0].trang_thai,
    must_change_password: false,
    ho_so: {
      loai: 'giang_vien',
      id: GIANG_VIEN_MOCK[0].id,
      ho_ten: GIANG_VIEN_MOCK[0].ho_ten,
      ma_gv: GIANG_VIEN_MOCK[0].ma_gv,
      chuyen_mon: GIANG_VIEN_MOCK[0].chuyen_mon,
    },
  },
  {
    id: 3,
    name: SINH_VIEN_MOCK[0].ho_ten,
    email: SINH_VIEN_MOCK[0].email,
    avatar_url: SINH_VIEN_MOCK[0].avatar_url,
    vai_tro: 'SINH_VIEN',
    trang_thai: SINH_VIEN_MOCK[0].trang_thai,
    must_change_password: false,
    ho_so: {
      loai: 'sinh_vien',
      id: SINH_VIEN_MOCK[0].id,
      ho_ten: SINH_VIEN_MOCK[0].ho_ten,
      ma_sv: SINH_VIEN_MOCK[0].ma_sv,
      lop_hanh_chinh_id: SINH_VIEN_MOCK[0].lop_hanh_chinh?.id ?? null,
    },
  },
];

export class AuthRegistry {
  private readonly taiKhoan: TaiKhoanMock[] = TAI_KHOAN_DANG_NHAP_MOCK.map((thongTin, index) => ({
    ...thongTin,
    nguoiDung: NGUOI_DUNG_MOCK[index],
  }));
  private readonly tokenBiThuHoi = new Set<string>();

  resolve(
    method: string,
    path: string,
    body: unknown,
    authorization: string | null,
  ): ApiResponse<unknown> | Record<string, unknown> | undefined {
    if (path === '/auth/login' && method === 'POST') return this.dangNhap(body);

    const nguoiDung = this.layNguoiDungTheoToken(authorization);
    if (path === '/auth/me' && method === 'GET') {
      return nguoiDung ? ok(nguoiDung) : loi('UNAUTHENTICATED', 'Vui lòng đăng nhập.');
    }
    if (path === '/auth/logout' && method === 'POST') {
      const token = this.layToken(authorization);
      if (!nguoiDung || !token) return loi('UNAUTHENTICATED', 'Vui lòng đăng nhập.');
      this.tokenBiThuHoi.add(token);
      return ok(null, 'Đăng xuất thành công.');
    }
    if (path === '/auth/change-password' && method === 'POST') {
      return this.doiMatKhau(nguoiDung, body);
    }

    return undefined;
  }

  private dangNhap(body: unknown): ApiResponse<unknown> | Record<string, unknown> {
    const data = this.docLieu(body);
    const email = typeof data['email'] === 'string' ? data['email'].trim().toLowerCase() : '';
    const maSinhVien = typeof data['ma_sv'] === 'string' ? data['ma_sv'].trim().toUpperCase() : '';
    const matKhau = typeof data['password'] === 'string' ? data['password'] : '';
    const taiKhoan = this.taiKhoan.find(
      (item) =>
        (email !== '' && item.nguoiDung.email.toLowerCase() === email) ||
        (maSinhVien !== '' &&
          item.vaiTro === 'SINH_VIEN' &&
          item.nguoiDung.ho_so?.loai === 'sinh_vien' &&
          item.nguoiDung.ho_so.ma_sv?.toUpperCase() === maSinhVien),
    );

    if (!taiKhoan || taiKhoan.matKhau !== matKhau || !taiKhoan.nguoiDung.trang_thai) {
      return loi('UNAUTHENTICATED', 'Thông tin đăng nhập hoặc mật khẩu không chính xác.');
    }

    const token = `mock-access-${taiKhoan.nguoiDung.id}`;
    this.tokenBiThuHoi.delete(token);
    const hetHan = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    return ok(
      {
        token,
        het_han_luc: hetHan,
        nguoi_dung: taiKhoan.nguoiDung,
      },
      'Đăng nhập thành công.',
    );
  }

  private doiMatKhau(
    nguoiDung: NguoiDung | null,
    body: unknown,
  ): ApiResponse<unknown> | Record<string, unknown> {
    if (!nguoiDung) return loi('UNAUTHENTICATED', 'Vui lòng đăng nhập.');

    const data = this.docLieu(body);
    const matKhauCu = typeof data['mat_khau_cu'] === 'string' ? data['mat_khau_cu'] : '';
    const matKhauMoi = typeof data['password'] === 'string' ? data['password'] : '';
    const xacNhan =
      typeof data['password_confirmation'] === 'string' ? data['password_confirmation'] : '';
    const taiKhoan = this.taiKhoan.find((item) => item.nguoiDung.id === nguoiDung.id);

    if (!taiKhoan || taiKhoan.matKhau !== matKhauCu) {
      return loiValidation({ mat_khau_cu: ['Mật khẩu hiện tại không chính xác.'] });
    }
    if (matKhauMoi.length < 8 || matKhauMoi !== xacNhan) {
      return loiValidation({
        password: ['Mật khẩu mới phải có ít nhất 8 ký tự.'],
        password_confirmation: ['Xác nhận mật khẩu không khớp.'],
      });
    }

    taiKhoan.matKhau = matKhauMoi;
    taiKhoan.nguoiDung = { ...taiKhoan.nguoiDung, must_change_password: false };
    return ok(null, 'Đổi mật khẩu thành công.');
  }

  private layNguoiDungTheoToken(authorization: string | null): NguoiDung | null {
    const token = this.layToken(authorization);
    if (!token || this.tokenBiThuHoi.has(token)) return null;
    const idText = token.replace(/^mock-access-/, '');
    if (idText === token) return null;
    const id = Number(idText);
    if (!Number.isInteger(id)) return null;
    return this.taiKhoan.find((item) => item.nguoiDung.id === id)?.nguoiDung ?? null;
  }

  private layToken(authorization: string | null): string | null {
    if (!authorization?.startsWith('Bearer ')) return null;
    return authorization.slice('Bearer '.length);
  }

  private docLieu(body: unknown): Record<string, unknown> {
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  }
}
