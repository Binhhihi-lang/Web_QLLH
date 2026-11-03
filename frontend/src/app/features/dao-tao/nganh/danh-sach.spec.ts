import { of } from 'rxjs';
import { Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { NganhDanhSach } from './danh-sach';

describe('NganhDanhSach', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<NganhDanhSach>>;
  let router: Router;
  let service: {
    layDanhSachNganh: ReturnType<typeof vi.fn>;
    layTuyChonKhoa: ReturnType<typeof vi.fn>;
    xoaNganh: ReturnType<typeof vi.fn>;
  };

  const nganh = {
    id: 1,
    khoa_id: 1,
    khoa: { id: 1, ma_khoa: 'CNTT', ten_khoa: 'Công nghệ thông tin' },
    ma_nganh: 'KTPM',
    ten_nganh: 'Công nghệ phần mềm',
    mo_ta: null,
    trang_thai: true,
    da_xoa: false,
  };
  const trang = {
    data: [nganh],
    meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
    success: true,
    message: 'Thành công',
  };

  beforeEach(() => {
    service = {
      layDanhSachNganh: vi.fn(() => of(trang)),
      layTuyChonKhoa: vi.fn(() => of([{ id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' }])),
      xoaNganh: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [NganhDanhSach],
      providers: [
        provideRouter([]),
        { provide: KhoaNganhService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    fixture = TestBed.createComponent(NganhDanhSach);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('displays ngành and its parent khoa', () => {
    expect(fixture.nativeElement.textContent).toContain('KTPM');
    expect(fixture.nativeElement.textContent).toContain('Công nghệ phần mềm');
    expect(fixture.nativeElement.textContent).toContain('Công nghệ thông tin');
  });

  it('navigates to ngành details when its row is clicked', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    row.click();

    expect(navigate).toHaveBeenCalledWith(['/nganh', nganh.id]);
  });

  it('filters ngành by parent khoa and status', () => {
    fixture.componentInstance.doiLocKhoa({
      target: { value: '1' },
    } as unknown as Event);
    fixture.componentInstance.doiLocTrangThai({
      target: { value: 'true' },
    } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSachNganh).toHaveBeenLastCalledWith(
      expect.objectContaining({ khoa_id: 1, trang_thai: true, page: 1 }),
    );
  });
});
