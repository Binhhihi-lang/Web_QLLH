import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HocKy } from '@core/models/dao-tao.model';
import { HocKyService } from './hoc-ky.service';
import { HocKyForm } from './form';

describe('HocKyForm', () => {
  const hocKy: HocKy = {
    id: 1,
    ma_hoc_ky: '2028-1',
    ten_hoc_ky: 'Học kỳ 1 năm học 2028-2029',
    nam_hoc: '2028-2029',
    ky_thu: 1,
    ngay_bat_dau: '2028-09-05',
    ngay_ket_thuc: '2029-01-15',
    mo_dang_ky_luc: '2028-09-06 08:00:00',
    dong_dang_ky_luc: '2028-09-08 17:00:00',
    trang_thai: 'UPCOMING',
    dang_mo_dang_ky: false,
  };

  it('validates and creates a semester with the API datetime format', () => {
    const service = { taoMoi: vi.fn(() => of(hocKy)), layMot: vi.fn() };
    TestBed.configureTestingModule({
      imports: [HocKyForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: HocKyService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(HocKyForm);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance;

    component.maHocKy.set('2028-1');
    component.tenHocKy.set(hocKy.ten_hoc_ky);
    component.namHoc.set('2028-2029');
    component.ngayBatDau.set('2028-09-05');
    component.ngayKetThuc.set('2029-01-15');
    component.moDangKyLuc.set('2028-09-06T08:00');
    component.dongDangKyLuc.set('2028-09-08T17:00');
    component.gui({ preventDefault: vi.fn() } as unknown as Event);

    expect(service.taoMoi).toHaveBeenCalledWith(
      expect.objectContaining({
        ma_hoc_ky: '2028-1',
        mo_dang_ky_luc: '2028-09-06 08:00:00',
        dong_dang_ky_luc: '2028-09-08 17:00:00',
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/hoc-ky']);
  });

  it('does not submit invalid date ranges', () => {
    const service = { taoMoi: vi.fn(), layMot: vi.fn() };
    TestBed.configureTestingModule({
      imports: [HocKyForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: HocKyService, useValue: service },
      ],
    });
    const component = TestBed.createComponent(HocKyForm).componentInstance;

    component.maHocKy.set('2028-1');
    component.tenHocKy.set(hocKy.ten_hoc_ky);
    component.namHoc.set('2028-2029');
    component.ngayBatDau.set('2028-09-05');
    component.ngayKetThuc.set('2028-09-05');
    component.moDangKyLuc.set('2028-09-06T08:00');
    component.dongDangKyLuc.set('2028-09-08T17:00');
    component.gui({ preventDefault: vi.fn() } as unknown as Event);

    expect(service.taoMoi).not.toHaveBeenCalled();
    expect(component.loiTruong('ngay_ket_thuc')).toContain('sau ngày bắt đầu');
  });

  it('makes closed semesters read-only', () => {
    const service = { taoMoi: vi.fn(), layMot: vi.fn(() => of({ ...hocKy, trang_thai: 'CLOSED' as const })) };
    TestBed.configureTestingModule({
      imports: [HocKyForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: HocKyService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(HocKyForm);
    fixture.detectChanges();

    expect(fixture.componentInstance.chiDoc()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Học kỳ đã đóng chỉ được xem');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
