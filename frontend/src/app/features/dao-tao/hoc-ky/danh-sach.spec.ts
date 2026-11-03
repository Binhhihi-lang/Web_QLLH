import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { HocKy } from '@core/models/dao-tao.model';
import { HocKyService } from './hoc-ky.service';
import { HocKyDanhSach } from './danh-sach';

describe('HocKyDanhSach', () => {
  const ongoing: HocKy = {
    id: 3,
    ma_hoc_ky: '2026-1',
    ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027',
    nam_hoc: '2026-2027',
    ky_thu: 1,
    ngay_bat_dau: '2026-09-07',
    ngay_ket_thuc: '2027-01-16',
    mo_dang_ky_luc: '2026-08-10 08:00:00',
    dong_dang_ky_luc: '2026-09-05 17:00:00',
    trang_thai: 'ONGOING',
    dang_mo_dang_ky: false,
  };
  const upcoming = { ...ongoing, id: 4, ma_hoc_ky: '2026-2', ky_thu: 2, trang_thai: 'UPCOMING' as const };
  const response = {
    success: true,
    message: 'Thành công',
    data: [ongoing, upcoming],
    meta: { current_page: 1, per_page: 10, total: 2, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
  };

  it('renders semesters and exposes only the next valid status action', () => {
    const service = {
      layDanhSach: vi.fn(() => of(response)),
      doiTrangThai: vi.fn((id: number, status: HocKy['trang_thai']) =>
        of({ ...upcoming, id, trang_thai: status }),
      ),
      xoa: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [HocKyDanhSach],
      providers: [
        provideRouter([]),
        { provide: HocKyService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    const fixture = TestBed.createComponent(HocKyDanhSach);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('2026-1');
    expect(fixture.nativeElement.textContent).toContain('Đang diễn ra');
    expect(fixture.nativeElement.textContent).toContain('Bắt đầu kỳ');
    expect(fixture.nativeElement.textContent).toContain('Đóng kỳ');
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(service.layDanhSach).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, sort_by: 'ma_hoc_ky' }),
    );

    fixture.componentInstance.hoiChuyenTrangThai(upcoming, 'ONGOING');
    fixture.componentInstance.xacNhan();
    expect(service.doiTrangThai).toHaveBeenCalledWith(upcoming.id, 'ONGOING');
  });

  it('navigates to semester details when a row is clicked', () => {
    const service = {
      layDanhSach: vi.fn(() => of(response)),
      doiTrangThai: vi.fn(),
      xoa: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [HocKyDanhSach],
      providers: [
        provideRouter([]),
        { provide: HocKyService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    const fixture = TestBed.createComponent(HocKyDanhSach);
    fixture.detectChanges();

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.nativeElement.querySelector('app-data-table tbody tr').click();

    expect(navigate).toHaveBeenCalledWith(['/hoc-ky', ongoing.id]);
  });

  it('filters by academic year and hides admin actions from teachers', () => {
    const service = {
      layDanhSach: vi.fn(() => of(response)),
      doiTrangThai: vi.fn(),
      xoa: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [HocKyDanhSach],
      providers: [
        provideRouter([]),
        { provide: HocKyService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'GIANG_VIEN' }) } },
      ],
    });
    const fixture = TestBed.createComponent(HocKyDanhSach);
    fixture.detectChanges();

    fixture.componentInstance.doiNamHoc({ target: { value: '2026-2027' } } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({ nam_hoc: '2026-2027' }),
    );
    expect(fixture.componentInstance.cot().some((column) => column.khoa === 'thao_tac')).toBe(
      false,
    );
  });
});
