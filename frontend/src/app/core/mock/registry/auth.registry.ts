import { NguoiDung } from '@core/models/dao-tao.model';
import { ApiResponse, MaLoi, loi, ok } from '@core/mock/mock-response';

interface TaiKhoanMock {
  tai_khoan: string;
  password: string;
  loai_tai_khoan: 'email' | 'ma_sv';
  nguoi_dung: NguoiDung;
}

interface DangNhapInput {
  email?: unknown;
  ma_sv?: unknown;
  password?: unknown;
}

interface PhanHoiDangNhap {
  token: string;
  het_han_luc: string;
  nguoi_dung: NguoiDung;
}

type PhanHoiMock = ApiResponse<unknown> | Record<string, unknown>;

const NGUOI_DUNG_MOCK: NguoiDung[] = [
  {
    id: 1,
    name: 'Quản trị viên',
    email: 'admin@example.com',
    avatar_url: null,
    vai_tro: 'ADMIN',
    trang_thai: true,
    must_change_password: false,
    ho_so: null,
  },
  {
    id: 2,
    name: 'Nguyễn Văn Giảng',
    email: 'giangvien@example.com',
    avatar_url: null,
    vai_tro: 'GIANG_VIEN',
    trang_thai: true,
    must_change_password: false,
    ho_so: {
      loai: 'giang_vien',
      id: 1,
      ma_gv: 'GV0000',
      ho_ten: 'Nguyễn Văn Giảng',
      chuyen_mon: 'Công nghệ phần mềm',
    },
  },
  {
    id: 3,
    name: 'Trần Thị Sinh',
    email: 'sinhvien@example.com',
    avatar_url: null,
    vai_tro: 'SINH_VIEN',
    trang_thai: true,
    must_change_password: false,
    ho_so: {
      loai: 'sinh_vien',
      id: 1,
      ma_sv: 'SV000000',
      ho_ten: 'Trần Thị Sinh',
      lop_hanh_chinh_id: 1,
    },
  },
];

const TAI_KHOAN_MOCK: TaiKhoanMock[] = [
  {
    tai_khoan: 'admin@example.com',
    password: 'password',
    loai_tai_khoan: 'email',
    nguoi_dung: NGUOI_DUNG_MOCK[0],
  },
  {
    tai_khoan: 'giangvien@example.com',
    password: 'password',
    loai_tai_khoan: 'email',
    nguoi_dung: NGUOI_DUNG_MOCK[1],
  },
  {
    tai_khoan: 'sinhvien@example.com',
    password: 'password',
    loai_tai_khoan: 'email',
    nguoi_dung: NGUOI_DUNG_MOCK[2],
  },
  {
    tai_khoan: 'SV000000',
    password: 'password',
    loai_tai_khoan: 'ma_sv',
    nguoi_dung: NGUOI_DUNG_MOCK[2],
  },
];

/**
 * Mock authentication for frontend work only. It is registered only when
 * `environment.useMock` enables the HTTP mock interceptor.
 */
export class AuthRegistry {
  private readonly tokenTheoNguoiDung = new Map<string, NguoiDung>();
  private lanPhatToken = 0;

  resolve(
    method: string,
    path: string,
    body: unknown,
    authorization: string | null,
  ): PhanHoiMock | undefined {
    if (path === '/auth/login' && method === 'POST') {
      return this.dangNhap(body);
    }
    if (path === '/auth/me' && method === 'GET') {
      const user = this.nguoiDungTheoToken(authorization);
      return user
        ? ok(user)
        : loi(MaLoi.UNAUTHENTICATED, 'Phiên đăng nhập mock không hợp lệ.');
    }
    if (path === '/auth/logout' && method === 'POST') {
      this.tokenTheoNguoiDung.delete(this.layToken(authorization) ?? '');
      return ok(null, 'Đã đăng xuất.');
    }
    if (path === '/auth/change-password' && method === 'POST') {
      return this.doiMatKhau(authorization, body);
    }

    return undefined;
  }

  private dangNhap(body: unknown): PhanHoiMock {
    const input = (body ?? {}) as DangNhapInput;
    const loaiTaiKhoan = typeof input.ma_sv === 'string' ? 'ma_sv' : 'email';
    const taiKhoan = loaiTaiKhoan === 'ma_sv' ? input.ma_sv : input.email;

    const taiKhoanMock = TAI_KHOAN_MOCK.find(
      (account) =>
        account.loai_tai_khoan === loaiTaiKhoan &&
        account.tai_khoan.toLocaleLowerCase() ===
          (typeof taiKhoan === 'string' ? taiKhoan.trim().toLocaleLowerCase() : '') &&
        account.password === input.password,
    );

    if (!taiKhoanMock) {
      return loi(MaLoi.UNAUTHENTICATED, 'Thông tin đăng nhập hoặc mật khẩu không chính xác.');
    }

    const token = `mock-access-${++this.lanPhatToken}`;
    this.tokenTheoNguoiDung.set(token, taiKhoanMock.nguoi_dung);

    return ok({
      token,
      het_han_luc: '2099-12-31T23:59:59Z',
      nguoi_dung: taiKhoanMock.nguoi_dung,
    });
  }

  private doiMatKhau(
    authorization: string | null,
    body: unknown,
  ): PhanHoiMock {
    const user = this.nguoiDungTheoToken(authorization);
    if (!user) return loi(MaLoi.UNAUTHENTICATED, 'Phiên đăng nhập mock không hợp lệ.');

    const input = (body ?? {}) as Record<string, unknown>;
    const account = TAI_KHOAN_MOCK.find((item) => item.nguoi_dung.id === user.id);
    const newPassword = input['password'];
    if (!account || input['mat_khau_cu'] !== account.password) {
      return loi(MaLoi.VALIDATION_ERROR, 'Mật khẩu hiện tại không chính xác.', {
        mat_khau_cu: ['Mật khẩu hiện tại không chính xác.'],
      });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return loi(MaLoi.VALIDATION_ERROR, 'Mật khẩu mới phải có ít nhất 8 ký tự.', {
        password: ['Mật khẩu mới phải có ít nhất 8 ký tự.'],
      });
    }
    if (newPassword !== input['password_confirmation']) {
      return loi(MaLoi.VALIDATION_ERROR, 'Xác nhận mật khẩu không khớp.', {
        password: ['Xác nhận mật khẩu không khớp.'],
      });
    }

    account.password = newPassword;
    const updatedUser = { ...user, must_change_password: false };
    this.tokenTheoNguoiDung.set(this.layToken(authorization)!, updatedUser);
    return ok(null, 'Đã đổi mật khẩu.');
  }

  private nguoiDungTheoToken(authorization: string | null): NguoiDung | undefined {
    const token = this.layToken(authorization);
    return token ? this.tokenTheoNguoiDung.get(token) : undefined;
  }

  private layToken(authorization: string | null): string | undefined {
    const match = authorization?.match(/^Bearer (.+)$/);
    return match?.[1];
  }
}
