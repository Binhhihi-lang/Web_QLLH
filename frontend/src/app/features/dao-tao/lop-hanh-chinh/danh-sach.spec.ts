import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { LopHanhChinhService } from './lop-hanh-chinh.service';
import { LopHanhChinhDanhSach } from './danh-sach';

describe('LopHanhChinhDanhSach', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<LopHanhChinhDanhSach>>;
  let service: { layDanhSach: ReturnType<typeof vi.fn>; xoa: ReturnType<typeof vi.fn> };

  const lop = {
    id: 1,
    ma_lop: 'CNTT-K65-01',
    ten_lop: 'Công nghệ thông tin K65 - Lớp 01',
    khoa_hoc: 'K65',
    nganh: 'CNTT',
    nam_nhap_hoc: 2023,
    si_so: 42,
    trang_thai: true,
    da_xoa: false,
  };
  const trang = {
    data: [lop],
    meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
    success: true,
    message: 'Thành công',
  };

  beforeEach(() => {
    service = { layDanhSach: vi.fn(() => of(trang)), xoa: vi.fn(() => of(undefined)) };
    TestBed.configureTestingModule({
      imports: [LopHanhChinhDanhSach],
      providers: [
        provideRouter([]),
        { provide: LopHanhChinhService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    fixture = TestBed.createComponent(LopHanhChinhDanhSach);
    fixture.detectChanges();
  });

  it('loads and displays class details and enrollment count', () => {
    expect(service.layDanhSach).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, sort_by: 'ma_lop', sort_dir: 'asc' }),
    );
    expect(fixture.nativeElement.textContent).toContain('CNTT-K65-01');
    expect(fixture.nativeElement.textContent).toContain('Công nghệ thông tin K65 - Lớp 01');
    expect(fixture.nativeElement.textContent).toContain('42');
    expect(fixture.nativeElement.textContent).toContain('Đang hoạt động');
  });

  it('applies cohort, major, and status filters', () => {
    fixture.componentInstance.doiLocKhoa({ target: { value: 'K65' } } as unknown as Event);
    fixture.componentInstance.doiLocNganh({ target: { value: 'CNTT' } } as unknown as Event);
    fixture.componentInstance.doiTrangThai({ target: { value: 'false' } } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({ khoa_hoc: 'K65', nganh: 'CNTT', trang_thai: false, page: 1 }),
    );
  });

  it('restarts pagination when filters change and sends sorting and page size', () => {
    fixture.componentInstance.doiTrang(3);
    fixture.componentInstance.doiCoTrang(25);
    fixture.componentInstance.doiSapXep({ sort_by: 'ten_lop', sort_dir: 'desc' });

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        per_page: 25,
        sort_by: 'ten_lop',
        sort_dir: 'desc',
      }),
    );
  });

  it('shows the API error message when loading fails', () => {
    service.layDanhSach.mockReturnValue(
      throwError(() => ({ error: { message: 'Không có quyền xem lớp.' } })),
    );
    fixture.componentInstance.tai();
    fixture.detectChanges();

    expect(fixture.componentInstance.loi()).toBe('Không có quyền xem lớp.');
    expect(fixture.nativeElement.textContent).toContain('Không có quyền xem lớp.');
  });

  it('asks before deleting a class and reloads the list after success', () => {
    fixture.componentInstance.hoiXoa(lop);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Xóa lớp hành chính');
    expect(service.xoa).not.toHaveBeenCalled();

    fixture.componentInstance.xacNhanXoa();

    expect(service.xoa).toHaveBeenCalledWith(lop.id);
    expect(fixture.componentInstance.lopChoXoa()).toBeNull();
    expect(service.layDanhSach).toHaveBeenCalledTimes(2);
  });

  it('keeps the confirmation open and explains when deletion is blocked', () => {
    service.xoa.mockReturnValue(
      throwError(() => ({
        error: { message: 'Không thể xóa lớp còn sinh viên chưa xóa.' },
      })),
    );
    fixture.componentInstance.hoiXoa(lop);
    fixture.componentInstance.xacNhanXoa();
    fixture.detectChanges();

    expect(fixture.componentInstance.lopChoXoa()).toEqual(lop);
    expect(fixture.componentInstance.lyDoChanXoa()).toBe(
      'Không thể xóa lớp còn sinh viên chưa xóa.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Không thể xóa lớp còn sinh viên chưa xóa.',
    );
  });
});
