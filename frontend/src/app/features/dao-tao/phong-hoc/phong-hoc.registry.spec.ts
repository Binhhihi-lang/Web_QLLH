import { TestBed } from '@angular/core/testing';
import { MockRegistry } from '@core/mock/mock-registry';

describe('MockRegistry phòng học', () => {
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

  const phongMoi = {
    ma_phong: 'TEST-RM-01',
    ten_phong: 'Phòng kiểm thử',
    suc_chua: 32,
    trang_thai: true,
  };

  it('tìm kiếm, lọc trạng thái và trả danh sách phân trang', () => {
    const tatCa = goi('GET', '/rooms?per_page=100');
    const timKiem = goi('GET', '/rooms?q=A101');
    const dangKhoa = goi('GET', '/rooms?trang_thai=false');

    expect(tatCa.success).toBe(true);
    expect(tatCa.data.length).toBeGreaterThan(0);
    expect(timKiem.data.every((row: { ma_phong: string }) => row.ma_phong.includes('A101'))).toBe(
      true,
    );
    expect(
      dangKhoa.data.every((row: { trang_thai: boolean }) => row.trang_thai === false),
    ).toBe(true);
  });

  it('tạo, cập nhật, xem chi tiết và xóa mềm phòng học', () => {
    const tao = goi('POST', '/rooms', phongMoi);
    expect(tao.success).toBe(true);
    expect(tao.data.ma_phong).toBe(phongMoi.ma_phong);

    const capNhat = goi('PUT', `/rooms/${tao.data.id}`, {
      ...phongMoi,
      ten_phong: 'Phòng đã cập nhật',
      suc_chua: 48,
    });
    expect(capNhat.data.ten_phong).toBe('Phòng đã cập nhật');
    expect(capNhat.data.suc_chua).toBe(48);
    expect(goi('GET', `/rooms/${tao.data.id}`).data.ten_phong).toBe('Phòng đã cập nhật');

    expect(goi('DELETE', `/rooms/${tao.data.id}`).success).toBe(true);
    expect(goi('GET', `/rooms/${tao.data.id}`).ma_loi).toBe('NOT_FOUND');
  });

  it('từ chối mã phòng trùng và sức chứa không hợp lệ', () => {
    const trungMa = goi('POST', '/rooms', { ...phongMoi, ma_phong: 'A101' });
    const saiDuLieu = goi('POST', '/rooms', {
      ...phongMoi,
      ma_phong: '',
      suc_chua: 0,
    });

    expect(trungMa.success).toBe(false);
    expect(trungMa.ma_loi).toBe('DUPLICATE_CODE');
    expect(saiDuLieu.success).toBe(false);
    expect(saiDuLieu.ma_loi).toBe('VALIDATION_ERROR');
    expect(saiDuLieu.errors?.['ma_phong']).toBeDefined();
    expect(saiDuLieu.errors?.['suc_chua']).toBeDefined();
  });

  it('xử lý hàng loạt độc lập và chặn xóa phòng còn lịch sắp diễn ra', () => {
    const tao = goi('POST', '/rooms', phongMoi);
    const status = goi('PATCH', '/rooms/bulk-status', {
      ids: [tao.data.id, 999999],
      trang_thai: false,
    });
    const xoa = goi('POST', '/rooms/bulk-delete', { ids: [2, tao.data.id] });
    const chiTietBiChan = goi('DELETE', '/rooms/8');

    expect(status.data.thanh_cong).toBe(1);
    expect(status.data.that_bai).toBe(1);
    expect(xoa.data.thanh_cong).toBe(1);
    expect(xoa.data.that_bai).toBe(1);
    expect(xoa.data.chi_tiet[0].ma_loi).toBe('DELETE_BLOCKED');
    expect(chiTietBiChan.ma_loi).toBe('DELETE_BLOCKED');
  });
});
