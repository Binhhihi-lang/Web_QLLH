import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MockRegistry } from '@core/mock/mock-registry';
import { mockInterceptor } from '@core/mock/mock.interceptor';
import { GiangVienService } from './giang-vien.service';

describe('GiangVienService', () => {
  let service: GiangVienService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockRegistry, provideHttpClient(withInterceptors([mockInterceptor]))],
    });
    service = TestBed.inject(GiangVienService);
  });

  it('loads teachers with the search and status filters from the API contract', async () => {
    const result = await firstValueFrom(
      service.layDanhSach({
        page: 1,
        per_page: 10,
        q: 'GV0001',
        sort_by: 'ma_gv',
        sort_dir: 'asc',
        trang_thai: true,
      }),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].ma_gv).toBe('GV0001');
    expect(result.data[0].trang_thai).toBe(true);
  });

  it('updates status for the requested teachers through bulk-status', async () => {
    const result = await firstValueFrom(service.doiTrangThaiHangLoat([1, 2], false));
    const locked = await firstValueFrom(
      service.layDanhSach({ page: 1, per_page: 10, trang_thai: false }),
    );

    expect(result.thanh_cong).toBe(2);
    expect(locked.data.map((teacher) => teacher.id)).toEqual(expect.arrayContaining([1, 2]));
  });

  it('surfaces the per-teacher delete restriction through bulk-delete', async () => {
    const before = await firstValueFrom(service.layDanhSach({ page: 1, per_page: 25 }));
    const result = await firstValueFrom(service.xoaHangLoat([1]));
    const after = await firstValueFrom(service.layDanhSach({ page: 1, per_page: 25 }));

    expect(result.thanh_cong).toBe(0);
    expect(result.chi_tiet[0].ma_loi).toBe('DELETE_BLOCKED');
    expect(after.meta.total).toBe(before.meta.total);
    expect(after.data.some((teacher) => teacher.id === 1)).toBe(true);
  });

  it('creates a teacher and returns the one-time password', async () => {
    const created = await firstValueFrom(
      service.taoMoi({
        ma_gv: 'GV-MOI',
        ho_ten: 'Giảng viên mới',
        email: 'gv-moi@example.edu.vn',
        so_dien_thoai: null,
        chuyen_mon: null,
        trang_thai: true,
      }),
    );

    expect(created.ma_gv).toBe('GV-MOI');
    expect(created.mat_khau_ban_dau).toBeTruthy();
    expect((await firstValueFrom(service.layMot(created.id))).email).toBe('gv-moi@example.edu.vn');
  });

  it('updates an existing teacher without changing the generated identity', async () => {
    const updated = await firstValueFrom(
      service.capNhat(1, {
        ma_gv: 'GV0001',
        ho_ten: 'Nguyễn Minh An đã sửa',
        email: 'an@example.edu.vn',
        so_dien_thoai: '0900000000',
        chuyen_mon: 'Hệ thống thông tin',
        trang_thai: true,
      }),
    );

    expect(updated.id).toBe(1);
    expect(updated.ho_ten).toBe('Nguyễn Minh An đã sửa');
    expect(updated.so_dien_thoai).toBe('0900000000');
  });

  it('surfaces the single-delete restriction when a teacher still has an open-term section', async () => {
    await expect(firstValueFrom(service.xoa(1))).rejects.toMatchObject({
      error: {
        ma_loi: 'DELETE_BLOCKED',
        message: expect.stringContaining('học kỳ chưa đóng'),
      },
    });
  });
});
