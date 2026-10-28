import { HttpParams } from '@angular/common/http';
import { loi, loiValidation, ok } from '@core/mock/mock-response';
import { vaiTroDuocThayMenu } from '@core/utils/menu-vai-tro';

type VaiTroMenu = 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN';

/**
 * `quan_ly` đọc giống `$request->boolean()` của Laravel: true/1/on/yes là bật,
 * false/0/off/no hoặc không truyền là tắt. Mọi giá trị khác coi như tắt, không
 * trả 422 — query string luôn là chuỗi nên siết kiểu chỉ gây lỗi oan.
 */
function laCoQuanLy(giaTri: string | null): boolean {
  if (giaTri === null) return false;
  return ['1', 'true', 'on', 'yes'].includes(giaTri.toLowerCase());
}

interface MenuMock {
  id: number;
  ten: string;
  url: string;
  vi_tri: 'header' | 'sidebar';
  nhom: string | null;
  vai_tro: VaiTroMenu[] | null;
  thu_tu: number;
  trang_thai: boolean;
}

const MENU_MOCK: MenuMock[] = [
  { id: 1, ten: 'Dashboard', url: '/dashboard', vi_tri: 'sidebar', nhom: 'Tổng quan', vai_tro: null, thu_tu: 1, trang_thai: true },
  { id: 2, ten: 'Lớp học phần', url: '/lop-hoc-phan', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: null, thu_tu: 10, trang_thai: true },
  { id: 3, ten: 'Lịch học', url: '/lich-hoc', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: null, thu_tu: 11, trang_thai: true },
  { id: 4, ten: 'Đăng ký', url: '/dang-ky', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: ['ADMIN'], thu_tu: 12, trang_thai: true },
  { id: 5, ten: 'Điểm danh', url: '/diem-danh', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: ['ADMIN', 'GIANG_VIEN'], thu_tu: 13, trang_thai: true },
  { id: 6, ten: 'Điểm', url: '/diem', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: ['ADMIN', 'GIANG_VIEN'], thu_tu: 14, trang_thai: true },
  { id: 20, ten: 'Đăng ký của tôi', url: '/dang-ky-cua-toi', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: ['SINH_VIEN'], thu_tu: 15, trang_thai: true },
  { id: 21, ten: 'Điểm của tôi', url: '/diem-cua-toi', vi_tri: 'sidebar', nhom: 'Học vụ', vai_tro: ['SINH_VIEN'], thu_tu: 16, trang_thai: true },
  { id: 7, ten: 'Sinh viên', url: '/sinh-vien', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: ['ADMIN', 'GIANG_VIEN'], thu_tu: 20, trang_thai: true },
  { id: 8, ten: 'Giảng viên', url: '/giang-vien', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: null, thu_tu: 21, trang_thai: true },
  { id: 9, ten: 'Lớp hành chính', url: '/lop-hanh-chinh', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: ['ADMIN', 'GIANG_VIEN'], thu_tu: 22, trang_thai: true },
  { id: 10, ten: 'Môn học', url: '/mon-hoc', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: null, thu_tu: 23, trang_thai: true },
  { id: 11, ten: 'Học kỳ', url: '/hoc-ky', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: null, thu_tu: 24, trang_thai: true },
  { id: 12, ten: 'Phòng học', url: '/phong-hoc', vi_tri: 'sidebar', nhom: 'Đào tạo', vai_tro: ['ADMIN', 'GIANG_VIEN'], thu_tu: 25, trang_thai: true },
  { id: 13, ten: 'Người dùng', url: '/nguoi-dung', vi_tri: 'sidebar', nhom: 'Hệ thống', vai_tro: ['ADMIN'], thu_tu: 30, trang_thai: true },
  { id: 14, ten: 'Menu', url: '/menu', vi_tri: 'sidebar', nhom: 'Hệ thống', vai_tro: ['ADMIN'], thu_tu: 31, trang_thai: true },
  { id: 15, ten: 'Cấu hình', url: '/cau-hinh', vi_tri: 'sidebar', nhom: 'Hệ thống', vai_tro: ['ADMIN'], thu_tu: 32, trang_thai: true },
  { id: 16, ten: 'Nhật ký', url: '/nhat-ky', vi_tri: 'sidebar', nhom: 'Hệ thống', vai_tro: ['ADMIN'], thu_tu: 33, trang_thai: true },
  { id: 17, ten: 'Thùng rác', url: '/thung-rac', vi_tri: 'sidebar', nhom: 'Hệ thống', vai_tro: ['ADMIN'], thu_tu: 34, trang_thai: true },
  { id: 18, ten: 'Tài khoản của tôi', url: '/tai-khoan', vi_tri: 'sidebar', nhom: 'Cá nhân', vai_tro: null, thu_tu: 40, trang_thai: true },
  { id: 19, ten: 'Giới thiệu', url: '/gioi-thieu', vi_tri: 'header', nhom: null, vai_tro: null, thu_tu: 1, trang_thai: true },
];

export class MenuRegistry {
  private readonly menus = MENU_MOCK.map((menu) => ({ ...menu }));

  resolve(
    method: string,
    path: string,
    params: HttpParams,
    body: unknown = null,
    vaiTro: string | null = null,
  ): object | undefined {
    if (path === '/menus' && method === 'GET') {
      const viTri = params.get('vi_tri');
      const quanLy = laCoQuanLy(params.get('quan_ly'));

      if (quanLy && vaiTro !== 'ADMIN') {
        return loi('FORBIDDEN', 'Bạn không có quyền quản lý danh sách menu.');
      }

      const menus = this.menus.filter((menu) => {
        if (viTri && menu.vi_tri !== viTri) return false;
        if (quanLy) return true;
        // Chưa đăng nhập thì chỉ thấy mục dùng chung — khớp backend, nơi
        // `$request->user()` không có vai trò.
        if (!menu.trang_thai) return false;
        if (!vaiTro) return !menu.vai_tro || menu.vai_tro.length === 0;
        return vaiTroDuocThayMenu(vaiTro, menu.vai_tro);
      });
      return ok(menus);
    }

    if (path === '/menus' && method === 'POST') {
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản lý menu.');
      const duLieu = this.chuanHoa(body);
      if (!duLieu) return loiValidation({ ten: ['Thông tin menu không hợp lệ.'] });
      const menu = { id: Math.max(0, ...this.menus.map((row) => row.id)) + 1, ...duLieu };
      this.menus.push(menu);
      return ok(menu, 'Tạo menu thành công.');
    }

    const match = path.match(/^\/menus\/(\d+)$/);
    if (!match) return undefined;
    const id = Number(match[1]);
    const index = this.menus.findIndex((menu) => menu.id === id);
    if (index < 0) return loi('NOT_FOUND', 'Không tìm thấy menu.');

    if (method === 'GET') {
      // Backend chỉ cho ADMIN xem chi tiết một mục.
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản lý menu.');
      return ok(this.menus[index]);
    }

    if (method === 'PUT') {
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản lý menu.');
      const duLieu = this.chuanHoa(body);
      if (!duLieu) return loiValidation({ ten: ['Thông tin menu không hợp lệ.'] });
      this.menus[index] = { id, ...duLieu };
      return ok(this.menus[index], 'Cập nhật menu thành công.');
    }

    if (method === 'DELETE') {
      if (vaiTro !== 'ADMIN') return loi('FORBIDDEN', 'Bạn không có quyền quản lý menu.');
      this.menus.splice(index, 1);
      return ok(null, 'Xóa menu thành công.');
    }

    return undefined;
  }

  private chuanHoa(body: unknown): Omit<MenuMock, 'id'> | null {
    if (body === null || typeof body !== 'object') return null;
    const duLieu = body as Record<string, unknown>;
    const vaiTro = duLieu['vai_tro'];
    const viTri = duLieu['vi_tri'];
    if (
      typeof duLieu['ten'] !== 'string' ||
      typeof duLieu['url'] !== 'string' ||
      (viTri !== 'header' && viTri !== 'sidebar') ||
      !this.laMangVaiTro(vaiTro) ||
      typeof duLieu['thu_tu'] !== 'number' ||
      typeof duLieu['trang_thai'] !== 'boolean'
    ) {
      return null;
    }
    const nhom = duLieu['nhom'];
    if (nhom !== null && typeof nhom !== 'string') return null;

    return {
      ten: duLieu['ten'],
      url: duLieu['url'],
      vi_tri: viTri,
      nhom,
      // Mảng rỗng và null cùng nghĩa "mọi vai trò" — chuẩn hóa về null.
      vai_tro: vaiTro && vaiTro.length > 0 ? [...new Set(vaiTro)] : null,
      thu_tu: duLieu['thu_tu'],
      trang_thai: duLieu['trang_thai'],
    };
  }

  private laMangVaiTro(giaTri: unknown): giaTri is VaiTroMenu[] | null {
    if (giaTri === null || giaTri === undefined) return true;
    if (!Array.isArray(giaTri)) return false;
    return giaTri.every(
      (vaiTro) => vaiTro === 'ADMIN' || vaiTro === 'GIANG_VIEN' || vaiTro === 'SINH_VIEN',
    );
  }
}
