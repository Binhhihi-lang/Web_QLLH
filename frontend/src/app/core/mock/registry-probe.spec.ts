import { TestBed } from '@angular/core/testing';
import { MockRegistry } from '@core/mock/mock-registry';
import { statusFor } from '@core/mock/mock-response';

/**
 * Kiểm tra mock layer khớp docs/04-api-contract.md.
 *
 * Đây là lưới an toàn cho việc tách nhánh: mock là thứ duy nhất đứng giữa FE
 * và BE, nên lệch tên đường dẫn hay tên trường ở đây sẽ không bị build hay
 * test nào khác bắt được — chỉ hiện ra vào ngày tắt mock.
 */
describe('MockRegistry khớp hợp đồng API', () => {
  let r: MockRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MockRegistry] });
    r = TestBed.inject(MockRegistry);
  });

  const goi = (path: string) =>
    r.resolve('GET', `http://localhost:8000/api${path}`, null) as any;

  it('dùng đường dẫn tiếng Anh của hợp đồng', () => {
    for (const p of [
      '/students',
      '/teachers',
      '/admin-classes',
      '/subjects',
      '/semesters',
      '/sections',
    ]) {
      expect(goi(p), p).toBeDefined();
    }
  });

  it('không còn đường dẫn tiếng Việt cũ', () => {
    for (const p of [
      '/sinh-vien',
      '/giang-vien',
      '/lop-hanh-chinh',
      '/mon-hoc',
      '/hoc-ky',
      '/lop-hoc-phan',
    ]) {
      expect(goi(p), p).toBeUndefined();
    }
  });

  it('options trả trường label, không phải nhan', () => {
    const res = goi('/options/subjects');
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].label).toBeTruthy();
    expect(res.data[0].nhan).toBeUndefined();
  });

  it('options dùng đúng tên đường dẫn hợp đồng', () => {
    for (const p of [
      'admin-classes',
      'subjects',
      'semesters',
      'teachers',
      'rooms',
      'sections',
    ]) {
      expect(goi(`/options/${p}`), p).toBeDefined();
    }
  });

  it('tìm kiếm dùng tham số q, không phải keyword', () => {
    const tatCa = goi('/students');
    const loc = goi('/students?q=SV0001');
    expect(loc.meta.total).toBeLessThan(tatCa.meta.total);
  });

  it('sắp xếp dùng sort_by + sort_dir', () => {
    const asc = goi('/students?sort_by=ma_sv&sort_dir=asc');
    const desc = goi('/students?sort_by=ma_sv&sort_dir=desc');
    expect(asc.data[0].ma_sv).not.toBe(desc.data[0].ma_sv);
  });

  it('lọc boolean đúng kiểu', () => {
    const khoa = goi('/students?trang_thai=false');
    expect(khoa.data.every((s: any) => s.trang_thai === false)).toBe(true);
  });

  it('lọc số đúng kiểu (nam_thu)', () => {
    const nam4 = goi('/sections?nam_thu=4');
    expect(nam4.data.every((s: any) => s.nam_thu === 4)).toBe(true);
  });

  it('per_page chỉ nhận 10/25/50/100', () => {
    expect(goi('/students?per_page=37').meta.per_page).toBe(10);
    expect(goi('/students?per_page=25').meta.per_page).toBe(25);
  });

  it('sinh viên trả lớp hành chính dạng object lồng', () => {
    const sv = goi('/students').data[0];
    expect(sv.lop_hanh_chinh).toBeDefined();
    expect(sv.lop_hanh_chinh.ma_lop).toBeTruthy();
    expect(sv.lop_hanh_chinh_id).toBeUndefined();
  });

  it('mã sinh viên không trùng — trùng thì chọn dòng và khoá route đều sai', () => {
    const all = goi('/students?per_page=100').data.map((s: any) => s.ma_sv);
    expect(new Set(all).size).toBe(all.length);
  });

  it('xóa mềm: bản ghi biến mất khỏi danh sách và khỏi chi tiết', () => {
    const truoc = goi('/students?per_page=100').meta.total;
    const id = goi('/students').data[0].id;

    const xoa = r.resolve('DELETE', `http://localhost:8000/api/students/${id}`, null) as any;
    expect(xoa.success).toBe(true);

    const sau = goi('/students?per_page=100').meta.total;
    expect(sau).toBe(truoc - 1);

    const chiTiet = r.resolve('GET', `http://localhost:8000/api/students/${id}`, null) as any;
    expect(chiTiet.success).toBe(false);
    expect(chiTiet.ma_loi).toBe('NOT_FOUND');
  });

  it('xóa hai lần cùng một id thì lần hai trả NOT_FOUND', () => {
    const id = goi('/students').data[0].id;
    const url = `http://localhost:8000/api/students/${id}`;
    expect((r.resolve('DELETE', url, null) as any).success).toBe(true);
    const lan2 = r.resolve('DELETE', url, null) as any;
    expect(lan2.success).toBe(false);
    expect(lan2.ma_loi).toBe('NOT_FOUND');
  });

  it('tạo sinh viên trả mật khẩu ban đầu đúng một lần và đưa hồ sơ vào danh sách', () => {
    const body = {
      ma_sv: 'SV-MOI-001',
      ho_ten: 'Nguyễn Sinh Viên',
      email: 'sv-moi-001@example.edu.vn',
      ngay_sinh: null,
      gioi_tinh: true,
      so_dien_thoai: null,
      dia_chi: null,
      lop_hanh_chinh_id: null,
      trang_thai: true,
    };
    const tao = r.resolve('POST', 'http://localhost:8000/api/students', body) as any;

    expect(tao.success).toBe(true);
    expect(tao.data.mat_khau_ban_dau).toHaveLength(12);

    const ds = goi('/students?per_page=100').data;
    expect(ds.some((sv: any) => sv.ma_sv === body.ma_sv)).toBe(true);
    expect(ds.find((sv: any) => sv.id === tao.data.id).mat_khau_ban_dau).toBeUndefined();
    expect(goi(`/students/${tao.data.id}`).data.mat_khau_ban_dau).toBeUndefined();
  });

  it('từ chối tạo sinh viên có mã hoặc email đã tồn tại', () => {
    const hienTai = goi('/students').data[0];
    const trungMa = r.resolve('POST', 'http://localhost:8000/api/students', {
      ma_sv: hienTai.ma_sv,
      ho_ten: 'Tên khác',
      email: 'khac@example.edu.vn',
    }) as any;
    const trungEmail = r.resolve('POST', 'http://localhost:8000/api/students', {
      ma_sv: 'SV-MOI-002',
      ho_ten: 'Tên khác',
      email: hienTai.email,
    }) as any;

    expect(trungMa.success).toBe(false);
    expect(trungMa.ma_loi).toBe('DUPLICATE_CODE');
    expect(trungMa.errors.ma_sv).toBeDefined();
    expect(trungEmail.success).toBe(false);
    expect(trungEmail.ma_loi).toBe('DUPLICATE_EMAIL');
    expect(trungEmail.errors.email).toBeDefined();
    expect(statusFor(trungMa.ma_loi)).toBe(422);
    expect(statusFor(trungEmail.ma_loi)).toBe(422);
  });

  it('cập nhật sinh viên theo PUT và trả NOT_FOUND cho id không tồn tại', () => {
    const hienTai = goi('/students').data[0];
    const body = {
      ma_sv: hienTai.ma_sv,
      ho_ten: 'Tên đã cập nhật',
      email: hienTai.email,
      ngay_sinh: hienTai.ngay_sinh,
      gioi_tinh: hienTai.gioi_tinh,
      so_dien_thoai: hienTai.so_dien_thoai,
      dia_chi: hienTai.dia_chi,
      lop_hanh_chinh_id: hienTai.lop_hanh_chinh.id,
      trang_thai: hienTai.trang_thai,
    };
    const sua = r.resolve(
      'PUT',
      `http://localhost:8000/api/students/${hienTai.id}`,
      body,
    ) as any;
    const khongTonTai = r.resolve('PUT', 'http://localhost:8000/api/students/999999', body) as any;

    expect(sua.success).toBe(true);
    expect(sua.data.ho_ten).toBe(body.ho_ten);
    expect(khongTonTai.success).toBe(false);
    expect(khongTonTai.ma_loi).toBe('NOT_FOUND');
  });

  // ---------------- Thao tác hàng loạt (BR-31) ----------------

  const bulk = (duongDan: string, body: unknown, method = 'POST') =>
    r.resolve(method, `http://localhost:8000/api${duongDan}`, body) as any;

  /** bulk-status là PATCH, bulk-delete là POST — theo docs/04 mục 5. */
  const bulkStatus = (ids: number[], trangThai: boolean) =>
    bulk('/students/bulk-status', { ids, trang_thai: trangThai }, 'PATCH');

  it('bulk-status đổi trạng thái nhiều dòng và trả 200 kèm chi_tiet', () => {
    const ids = goi('/students').data.slice(0, 3).map((s: any) => s.id);
    const res = bulkStatus(ids, false);

    expect(res.success).toBe(true);
    expect(res.data.thanh_cong).toBe(3);
    expect(res.data.that_bai).toBe(0);
    expect(res.data.chi_tiet).toHaveLength(3);

    const sau = goi('/students?trang_thai=false&per_page=100').data.map((s: any) => s.id);
    for (const id of ids) expect(sau).toContain(id);
  });

  it('bulk xử lý từng dòng độc lập: id không tồn tại không làm hỏng dòng khác', () => {
    const id = goi('/students').data[0].id;
    const res = bulkStatus([id, 999999], false);

    expect(res.success).toBe(true);
    expect(res.data.thanh_cong).toBe(1);
    expect(res.data.that_bai).toBe(1);
    expect(res.data.chi_tiet.find((c: any) => c.id === 999999).ma_loi).toBe('NOT_FOUND');
  });

  it('bulk với danh sách rỗng trả 422 VALIDATION_ERROR', () => {
    const res = bulkStatus([], true);
    expect(res.success).toBe(false);
    expect(res.ma_loi).toBe('VALIDATION_ERROR');
  });

  it('bulk quá 500 id bị từ chối', () => {
    const ids = Array.from({ length: 501 }, (_, i) => i + 1);
    const res = bulk('/students/bulk-delete', { ids });
    expect(res.success).toBe(false);
    expect(res.ma_loi).toBe('VALIDATION_ERROR');
  });

  it('bulk-delete ẩn bản ghi khỏi danh sách', () => {
    const ids = goi('/students').data.slice(0, 2).map((s: any) => s.id);
    const truoc = goi('/students?per_page=100').meta.total;

    expect(bulk('/students/bulk-delete', { ids }).data.thanh_cong).toBe(2);
    expect(goi('/students?per_page=100').meta.total).toBe(truoc - 2);
  });
});
