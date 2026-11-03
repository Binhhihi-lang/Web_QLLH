import { of, throwError } from 'rxjs';
import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { KhoaDanhSach } from './danh-sach';

describe('KhoaDanhSach', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KhoaDanhSach>>;
  let router: Router;
  let service: {
    layDanhSachKhoa: ReturnType<typeof vi.fn>;
    xoaKhoa: ReturnType<typeof vi.fn>;
  };

  const khoa = {
    id: 1,
    ma_khoa: 'CNTT',
    ten_khoa: 'Công nghệ thông tin',
    mo_ta: 'Khối công nghệ',
    trang_thai: true,
    so_nganh: 4,
    da_xoa: false,
  };
  const trang = {
    data: [khoa],
    meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
    success: true,
    message: 'Thành công',
  };

  beforeEach(() => {
    service = {
      layDanhSachKhoa: vi.fn(() => of(trang)),
      xoaKhoa: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [KhoaDanhSach],
      providers: [
        provideRouter([]),
        { provide: KhoaNganhService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    fixture = TestBed.createComponent(KhoaDanhSach);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('loads and displays khoa and ngành count', () => {
    expect(service.layDanhSachKhoa).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, sort_by: 'ma_khoa', sort_dir: 'asc' }),
    );
    expect(fixture.nativeElement.textContent).toContain('Công nghệ thông tin');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).toContain('Đang hoạt động');
  });

  it('navigates to khoa details when its row is clicked', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    row.click();

    expect(navigate).toHaveBeenCalledWith(['/khoa', khoa.id]);
  });

  it('filters khoa by search text and status', () => {
    fixture.componentInstance.doiTuKhoa('CNTT');
    fixture.componentInstance.doiLocTrangThai({
      target: { value: 'false' },
    } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSachKhoa).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'CNTT', trang_thai: false, page: 1 }),
    );
  });

  it('requires confirmation before deletion and reloads after success', () => {
    fixture.componentInstance.hoiXoa(khoa);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Xóa khoa');
    expect(service.xoaKhoa).not.toHaveBeenCalled();

    fixture.componentInstance.xacNhanXoa();

    expect(service.xoaKhoa).toHaveBeenCalledWith(khoa.id);
    expect(fixture.componentInstance.khoaChoXoa()).toBeNull();
    expect(service.layDanhSachKhoa).toHaveBeenCalledTimes(2);
  });

  it('keeps the confirmation open and displays the reason when deletion is blocked', () => {
    service.xoaKhoa.mockReturnValue(
      throwError(() => ({
        error: { message: 'Không thể xóa khoa đang có ngành.' },
      })),
    );
    fixture.componentInstance.hoiXoa(khoa);
    fixture.componentInstance.xacNhanXoa();
    fixture.detectChanges();

    expect(fixture.componentInstance.khoaChoXoa()).toEqual(khoa);
    expect(fixture.componentInstance.lyDoChanXoa()).toBe('Không thể xóa khoa đang có ngành.');
    expect(fixture.nativeElement.textContent).toContain('Không thể xóa khoa đang có ngành.');
  });
});
