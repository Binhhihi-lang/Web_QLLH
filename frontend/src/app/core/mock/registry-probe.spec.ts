import { TestBed } from '@angular/core/testing';
import { MockRegistry } from '@core/mock/mock-registry';

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
