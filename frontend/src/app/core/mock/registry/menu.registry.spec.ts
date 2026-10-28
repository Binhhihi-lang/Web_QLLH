import { HttpParams } from '@angular/common/http';
import { MenuRegistry } from './menu.registry';

const ADMIN = 'ADMIN';
const GIANG_VIEN = 'GIANG_VIEN';
const SINH_VIEN = 'SINH_VIEN';

const PAYLOAD = {
  ten: 'Báo cáo',
  url: '/bao-cao',
  vi_tri: 'sidebar' as const,
  nhom: 'Hệ thống',
  vai_tro: ['ADMIN'] as const,
  thu_tu: 35,
  trang_thai: true,
};

function danhSach(registry: MenuRegistry, vaiTro: string | null, thamSo: Record<string, string> = {}) {
  let params = new HttpParams();
  for (const [khoa, giaTri] of Object.entries(thamSo)) params = params.set(khoa, giaTri);

  return registry.resolve('GET', '/menus', params, null, vaiTro) as {
    success: boolean;
    ma_loi?: string;
    data: Array<{ id: number; ten: string; url: string; trang_thai: boolean }>;
  };
}

describe('MenuRegistry', () => {
  it('creates, hides, lists, and deletes menu entries for the mock API', () => {
    const registry = new MenuRegistry();

    const created = registry.resolve('POST', '/menus', new HttpParams(), PAYLOAD, ADMIN) as {
      data: { id: number; ten: string; trang_thai: boolean };
    };
    expect(created.data).toMatchObject({ ten: 'Báo cáo', trang_thai: true });

    registry.resolve('PUT', `/menus/${created.data.id}`, new HttpParams(), {
      ...PAYLOAD,
      trang_thai: false,
    }, ADMIN);

    const sidebar = danhSach(registry, ADMIN, { vi_tri: 'sidebar' });
    expect(sidebar.data.some((menu) => menu.ten === 'Báo cáo')).toBe(false);

    const managementList = danhSach(registry, ADMIN, { quan_ly: '1' });
    expect(managementList.data).toContainEqual(
      expect.objectContaining({ id: created.data.id, ten: 'Báo cáo', trang_thai: false }),
    );

    registry.resolve('DELETE', `/menus/${created.data.id}`, new HttpParams(), null, ADMIN);
    const afterDelete = danhSach(registry, ADMIN, { quan_ly: '1' });
    expect(afterDelete.data.some((menu) => menu.id === created.data.id)).toBe(false);
  });

  describe('lọc theo vai trò — phải giống backend', () => {
    it('gives ADMIN every visible entry, including entries of other roles', () => {
      const ketQua = danhSach(new MenuRegistry(), ADMIN, { vi_tri: 'sidebar' });

      expect(ketQua.data.some((m) => m.url === '/nguoi-dung')).toBe(true);
      expect(ketQua.data.some((m) => m.url === '/diem-danh')).toBe(true);
    });

    it('hides entries of other roles from a teacher and a student', () => {
      const cuaGiangVien = danhSach(new MenuRegistry(), GIANG_VIEN, { vi_tri: 'sidebar' });
      expect(cuaGiangVien.data.some((m) => m.url === '/nguoi-dung')).toBe(false);
      expect(cuaGiangVien.data.some((m) => m.url === '/diem-danh')).toBe(true);

      const cuaSinhVien = danhSach(new MenuRegistry(), SINH_VIEN, { vi_tri: 'sidebar' });
      expect(cuaSinhVien.data.some((m) => m.url === '/diem-danh')).toBe(false);
      expect(cuaSinhVien.data.some((m) => m.url === '/dang-ky-cua-toi')).toBe(true);
    });

    it('keeps the two personal student pages away from ADMIN', () => {
      const cuaAdmin = danhSach(new MenuRegistry(), ADMIN, { vi_tri: 'sidebar' });

      expect(cuaAdmin.data.some((m) => m.url === '/dang-ky-cua-toi')).toBe(false);
      expect(cuaAdmin.data.some((m) => m.url === '/diem-cua-toi')).toBe(false);
    });

    it('shows only shared entries before login', () => {
      const chuaDangNhap = danhSach(new MenuRegistry(), null, { vi_tri: 'sidebar' });

      expect(chuaDangNhap.data.length).toBeGreaterThan(0);
      expect(chuaDangNhap.data.some((m) => m.url === '/nguoi-dung')).toBe(false);
      expect(chuaDangNhap.data.some((m) => m.url === '/diem-danh')).toBe(false);
    });
  });

  describe('quyền quản trị', () => {
    it('serves a single menu by id to ADMIN only', () => {
      const cuaAdmin = new MenuRegistry().resolve(
        'GET',
        '/menus/14',
        new HttpParams(),
        null,
        ADMIN,
      ) as { success: boolean; data: { url: string } };
      expect(cuaAdmin.success).toBe(true);
      expect(cuaAdmin.data.url).toBe('/menu');

      const cuaSinhVien = new MenuRegistry().resolve(
        'GET',
        '/menus/14',
        new HttpParams(),
        null,
        SINH_VIEN,
      ) as { success: boolean; ma_loi?: string };
      expect(cuaSinhVien.success).toBe(false);
      expect(cuaSinhVien.ma_loi).toBe('FORBIDDEN');
    });

    it('rejects quan_ly=1 for a non-admin', () => {
      const ketQua = danhSach(new MenuRegistry(), SINH_VIEN, { quan_ly: '1' });

      expect(ketQua.success).toBe(false);
      expect(ketQua.ma_loi).toBe('FORBIDDEN');
    });

    it('rejects writes from a non-admin', () => {
      const registry = new MenuRegistry();

      const tao = registry.resolve('POST', '/menus', new HttpParams(), PAYLOAD, SINH_VIEN) as {
        success: boolean;
        ma_loi?: string;
      };
      expect(tao.success).toBe(false);
      expect(tao.ma_loi).toBe('FORBIDDEN');

      const xoa = registry.resolve('DELETE', '/menus/1', new HttpParams(), null, GIANG_VIEN) as {
        success: boolean;
        ma_loi?: string;
      };
      expect(xoa.success).toBe(false);
      expect(xoa.ma_loi).toBe('FORBIDDEN');
    });

    it('reads quan_ly as a boolean: bật thì lấy cả mục ẩn, tắt thì không', () => {
      // Giá trị bật — mọi cách viết đều như nhau.
      for (const giaTri of ['1', 'true', 'on', 'yes']) {
        const ketQua = danhSach(new MenuRegistry(), ADMIN, { quan_ly: giaTri });
        expect(ketQua.success, `quan_ly=${giaTri} phải bật chế độ quản lý`).toBe(true);
      }

      // Giá trị tắt — chỉ trả mục đang hiển thị, không cần quyền ADMIN.
      for (const giaTri of ['0', 'false', 'off', 'no']) {
        const ketQua = danhSach(new MenuRegistry(), SINH_VIEN, { quan_ly: giaTri });
        expect(ketQua.success, `quan_ly=${giaTri} phải tắt chế độ quản lý`).toBe(true);
      }
    });
  });
});
