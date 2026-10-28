import { TestBed } from '@angular/core/testing';
import { LOP_HOC_PHAN_MOCK } from '@core/mock/data/hoc-vu.mock';
import { MockRegistry } from '@core/mock/mock-registry';

describe('MockRegistry môn học', () => {
  let registry: MockRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MockRegistry] });
    registry = TestBed.inject(MockRegistry);
  });

  const goi = (method: string, path: string, body: unknown = null) =>
    registry.resolve(method, `http://localhost:8000/api${path}`, body) as {
      success: boolean;
      data: any;
      ma_loi?: string;
      errors?: Record<string, string[]>;
    };

  const monMoi = {
    ma_mon: 'MOCK-SCR19-NEW',
    ten_mon: 'Môn học kiểm thử',
    so_tin_chi: 3,
    mo_ta: 'Dữ liệu mock',
    trang_thai: true,
  };

  it('tạo, cập nhật, lọc và trả chi tiết môn học', () => {
    const tao = goi('POST', '/subjects', monMoi);
    expect(tao.success).toBe(true);
    expect(tao.data.ma_mon).toBe(monMoi.ma_mon);

    const capNhat = goi('PUT', `/subjects/${tao.data.id}`, {
      ...monMoi,
      ten_mon: 'Tên môn đã cập nhật',
    });
    expect(capNhat.data.ten_mon).toBe('Tên môn đã cập nhật');
    expect(goi('GET', `/subjects/${tao.data.id}`).data.ten_mon).toBe('Tên môn đã cập nhật');
    expect(goi('GET', '/subjects?q=MOCK-SCR19-NEW').data).toHaveLength(1);
  });

  it('lọc danh sách theo số tín chỉ và từ chối giá trị ngoài khoảng', () => {
    const threeCredits = goi('GET', '/subjects?so_tin_chi=3');
    const invalid = goi('GET', '/subjects?so_tin_chi=11');

    expect(threeCredits.success).toBe(true);
    expect(threeCredits.data.length).toBeGreaterThan(0);
    expect(threeCredits.data.every((row: { so_tin_chi: number }) => row.so_tin_chi === 3)).toBe(
      true,
    );
    expect(invalid.success).toBe(false);
    expect(invalid.ma_loi).toBe('VALIDATION_ERROR');
    expect(invalid.errors?.['so_tin_chi']).toBeDefined();
  });

  it('từ chối mã trùng và dữ liệu không hợp lệ theo API', () => {
    const trungMa = goi('POST', '/subjects', {
      ...monMoi,
      ma_mon: 'INT2203',
    });
    const saiDuLieu = goi('POST', '/subjects', {
      ...monMoi,
      ma_mon: ' ',
      so_tin_chi: 11,
    });

    expect(trungMa.success).toBe(false);
    expect(trungMa.ma_loi).toBe('DUPLICATE_CODE');
    expect(saiDuLieu.success).toBe(false);
    expect(saiDuLieu.ma_loi).toBe('VALIDATION_ERROR');
    expect(saiDuLieu.errors?.['ma_mon']).toBeDefined();
    expect(saiDuLieu.errors?.['so_tin_chi']).toBeDefined();
  });

  it('đổi trạng thái và ẩn môn đã khóa khỏi options mặc định', () => {
    const tao = goi('POST', '/subjects', monMoi);
    const khoa = goi('PATCH', `/subjects/${tao.data.id}/status`, { trang_thai: false });
    const optionsMacDinh = goi('GET', '/options/subjects');
    const optionsTatCa = goi('GET', '/options/subjects?tat_ca=1');

    expect(khoa.data.trang_thai).toBe(false);
    expect(optionsMacDinh.data.some((row: { id: number }) => row.id === tao.data.id)).toBe(false);
    expect(optionsTatCa.data.some((row: { id: number }) => row.id === tao.data.id)).toBe(true);
  });

  it('chặn xóa môn còn lớp thuộc học kỳ chưa đóng', () => {
    const lopDangMo = LOP_HOC_PHAN_MOCK.find(
      (row) => !row.da_xoa && row.hoc_ky.trang_thai !== 'CLOSED',
    );
    expect(lopDangMo).toBeDefined();

    const result = goi('DELETE', `/subjects/${lopDangMo!.mon_hoc.id}`);
    expect(result.success).toBe(false);
    expect(result.ma_loi).toBe('DELETE_BLOCKED');
  });

  it('bulk-status xử lý từng môn và bulk-delete xóa mềm môn không bị ràng buộc', () => {
    const tao = goi('POST', '/subjects', monMoi);
    const status = goi('PATCH', '/subjects/bulk-status', {
      ids: [tao.data.id, 999999],
      trang_thai: false,
    });
    const xoa = goi('POST', '/subjects/bulk-delete', { ids: [tao.data.id] });
    const danhSach = goi('GET', '/subjects?per_page=100');

    expect(status.data.thanh_cong).toBe(1);
    expect(status.data.that_bai).toBe(1);
    expect(xoa.data.thanh_cong).toBe(1);
    expect(danhSach.data.some((row: { id: number }) => row.id === tao.data.id)).toBe(false);
  });
});
