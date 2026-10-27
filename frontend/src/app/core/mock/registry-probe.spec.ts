import { TestBed } from '@angular/core/testing';
import { MockRegistry } from '@core/mock/mock-registry';
import { statusFor } from '@core/mock/mock-response';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';

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

  const goi = (path: string) => r.resolve('GET', `http://localhost:8000/api${path}`, null) as any;

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
    for (const p of ['admin-classes', 'subjects', 'semesters', 'teachers', 'rooms', 'sections']) {
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

  it('chặn xóa giảng viên còn phụ trách lớp học phần thuộc học kỳ chưa đóng', () => {
    const id = goi('/teachers').data[0].id;
    const xoa = r.resolve('DELETE', `http://localhost:8000/api/teachers/${id}`, null) as any;

    expect(xoa.success).toBe(false);
    expect(xoa.ma_loi).toBe('DELETE_BLOCKED');
    expect(statusFor(xoa.ma_loi)).toBe(409);
  });

  it('xóa mềm giảng viên không còn lớp đang mở và từ chối xóa lại', () => {
    const id = goi('/teachers').data[0].id;
    const lopLienQuan = LOP_HOC_PHAN_MOCK.filter((lop) => lop.giang_vien.id === id);
    const trangThaiXoaCu = lopLienQuan.map((lop) => lop.da_xoa);
    lopLienQuan.forEach((lop) => (lop.da_xoa = true));

    try {
      const xoa = r.resolve('DELETE', `http://localhost:8000/api/teachers/${id}`, null) as any;
      const danhSachSauXoa = goi('/teachers?per_page=100');
      const xoaLanHai = r.resolve(
        'DELETE',
        `http://localhost:8000/api/teachers/${id}`,
        null,
      ) as any;

      expect(xoa.success).toBe(true);
      expect(danhSachSauXoa.data.some((gv: any) => gv.id === id)).toBe(false);
      expect(xoaLanHai.success).toBe(false);
      expect(xoaLanHai.ma_loi).toBe('NOT_FOUND');
    } finally {
      lopLienQuan.forEach((lop, index) => (lop.da_xoa = trangThaiXoaCu[index]));
    }
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
    const sua = r.resolve('PUT', `http://localhost:8000/api/students/${hienTai.id}`, body) as any;
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
    const ids = goi('/students')
      .data.slice(0, 3)
      .map((s: any) => s.id);
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
    const ids = goi('/students')
      .data.slice(0, 2)
      .map((s: any) => s.id);
    const truoc = goi('/students?per_page=100').meta.total;

    expect(bulk('/students/bulk-delete', { ids }).data.thanh_cong).toBe(2);
    expect(goi('/students?per_page=100').meta.total).toBe(truoc - 2);
  });

  it('giảng viên hỗ trợ tìm kiếm và lọc trạng thái', () => {
    const tatCa = goi('/teachers?per_page=100');
    const timKiem = goi('/teachers?q=GV0001');
    const khoa = goi('/teachers?trang_thai=false&per_page=100');

    expect(timKiem.data).toHaveLength(1);
    expect(timKiem.data[0].ma_gv).toBe('GV0001');
    expect(khoa.data.every((gv: any) => gv.trang_thai === false)).toBe(true);
    expect(tatCa.meta.total).toBeGreaterThan(khoa.meta.total);
  });

  it('bulk-status giảng viên đổi trạng thái theo từng dòng', () => {
    const ids = goi('/teachers')
      .data.slice(0, 2)
      .map((gv: any) => gv.id);
    const res = bulk('/teachers/bulk-status', { ids, trang_thai: false }, 'PATCH');

    expect(res.success).toBe(true);
    expect(res.data.thanh_cong).toBe(2);
    expect(goi('/teachers?trang_thai=false&per_page=100').data.map((gv: any) => gv.id)).toEqual(
      expect.arrayContaining(ids),
    );
  });

  it('bulk-delete chặn từng giảng viên còn phụ trách lớp trong học kỳ chưa đóng', () => {
    const id = goi('/teachers').data[0].id;
    const truoc = goi('/teachers?per_page=100').meta.total;
    const res = bulk('/teachers/bulk-delete', { ids: [id] });

    expect(res.data.thanh_cong).toBe(0);
    expect(res.data.that_bai).toBe(1);
    expect(res.data.chi_tiet[0].ma_loi).toBe('DELETE_BLOCKED');
    expect(goi('/teachers?per_page=100').meta.total).toBe(truoc);
    expect(goi('/teachers?per_page=100').data.some((gv: any) => gv.id === id)).toBe(true);
  });

  it('giảng viên hỗ trợ tạo hồ sơ và từ chối trùng mã hoặc email', () => {
    const original = goi('/teachers').data[0];
    const created = bulk(
      '/teachers',
      {
        ma_gv: 'GV-MOCK-NEW',
        ho_ten: 'Giảng viên tạo mới',
        email: 'gv-mock-new@example.edu.vn',
      },
      'POST',
    );
    const duplicateEmail = bulk(
      '/teachers',
      {
        ma_gv: 'GV-MOCK-OTHER',
        ho_ten: 'Email trùng',
        email: original.email,
      },
      'POST',
    );

    expect(created.success).toBe(true);
    expect(created.data.mat_khau_ban_dau).toBeTruthy();
    expect(duplicateEmail.success).toBe(false);
    expect(duplicateEmail.ma_loi).toBe('DUPLICATE_EMAIL');
  });

  it('giảng viên hỗ trợ cập nhật và ẩn hồ sơ đã xóa khỏi chi tiết', () => {
    const id = goi('/teachers').data[0].id;
    const updated = bulk(
      `/teachers/${id}`,
      {
        ma_gv: 'GV0001',
        ho_ten: 'Tên giảng viên đã cập nhật',
        email: 'gv0001@university.edu.vn',
        chuyen_mon: 'Hệ thống thông tin',
        trang_thai: true,
      },
      'PUT',
    );

    expect(updated.success).toBe(true);
    expect(updated.data.ho_ten).toBe('Tên giảng viên đã cập nhật');
    expect(goi(`/teachers/${id}`).data.id).toBe(id);
  });

  it('lớp học phần hỗ trợ tạo, cập nhật, đổi trạng thái và xóa mềm', () => {
    const original = LOP_HOC_PHAN_MOCK[0];
    const body = {
      ma_lop_hp: 'TEST-SECTION-MOCK',
      mon_hoc_id: original.mon_hoc.id,
      hoc_ky_id: original.hoc_ky.id,
      giang_vien_id: original.giang_vien.id,
      si_so_toi_da: 48,
      nam_thu: null,
      trang_thai: 'OPEN',
    };
    const tao = r.resolve('POST', 'http://localhost:8000/api/sections', body) as any;
    const capNhat = r.resolve('PUT', `http://localhost:8000/api/sections/${tao.data.id}`, {
      ...body,
      si_so_toi_da: 50,
    }) as any;
    const doiTrangThai = r.resolve(
      'PATCH',
      `http://localhost:8000/api/sections/${tao.data.id}/status`,
      { trang_thai: 'CANCELLED' },
    ) as any;

    expect(tao.success).toBe(true);
    expect(capNhat.data.si_so_toi_da).toBe(50);
    expect(doiTrangThai.data.trang_thai).toBe('CANCELLED');
    expect(
      (r.resolve('DELETE', `http://localhost:8000/api/sections/${tao.data.id}`) as any).success,
    ).toBe(true);
    expect(
      (r.resolve('GET', `http://localhost:8000/api/sections/${tao.data.id}`) as any).ma_loi,
    ).toBe('NOT_FOUND');
  });

  it('từ chối sửa lớp học phần không tồn tại và validate mã trùng trong học kỳ', () => {
    const original = LOP_HOC_PHAN_MOCK[0];
    const body = {
      ma_lop_hp: original.ma_lop_hp,
      mon_hoc_id: original.mon_hoc.id,
      hoc_ky_id: original.hoc_ky.id,
      giang_vien_id: original.giang_vien.id,
      si_so_toi_da: original.si_so_toi_da,
      nam_thu: original.nam_thu,
      trang_thai: original.trang_thai,
    };
    const missing = r.resolve('PUT', 'http://localhost:8000/api/sections/999999', body) as any;
    const duplicate = r.resolve('POST', 'http://localhost:8000/api/sections', body) as any;

    expect(missing.ma_loi).toBe('NOT_FOUND');
    expect(duplicate.success).toBe(false);
    expect(duplicate.ma_loi).toBe('VALIDATION_ERROR');
  });

  it('không cho chốt điểm khi còn thiếu điểm thành phần', () => {
    const id = LOP_HOC_PHAN_MOCK[0].id;
    const loaded = r.resolve('GET', `http://localhost:8000/api/sections/${id}/grades`) as any;
    const rows = loaded.data.map((row: any, index: number) =>
      index === 0 ? { ...row, diem_cuoi_ky: null } : row,
    );
    r.resolve('PUT', `http://localhost:8000/api/sections/${id}/grades`, { diem: rows });

    const finalize = r.resolve(
      'POST',
      `http://localhost:8000/api/sections/${id}/finalize`,
      {},
    ) as any;
    expect(finalize.success).toBe(false);
    expect(finalize.ma_loi).toBe('GRADE_INCOMPLETE');
  });

  it('hủy đăng ký lớp học phần sẽ loại sinh viên khỏi danh sách ACTIVE', () => {
    const id = LOP_HOC_PHAN_MOCK[0].id;
    const students = r.resolve('GET', `http://localhost:8000/api/sections/${id}/students`) as any;
    const enrollmentId = students.data[0].dang_ky_hoc_phan_id;
    const canceled = r.resolve('DELETE', `http://localhost:8000/api/enrollments/${enrollmentId}`, {
      ly_do: 'Điều chỉnh đăng ký',
    }) as any;
    const after = r.resolve('GET', `http://localhost:8000/api/sections/${id}/students`) as any;

    expect(canceled.success).toBe(true);
    expect(after.data).toHaveLength(students.data.length - 1);
    expect(after.data.some((student: any) => student.dang_ky_hoc_phan_id === enrollmentId)).toBe(
      false,
    );
  });
});
