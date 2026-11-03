import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { HocKy } from '@core/models/dao-tao.model';
import { HocKyService } from './hoc-ky.service';
import { HocKyChiTiet } from './chi-tiet';

describe('HocKyChiTiet', () => {
  const hocKy: HocKy = {
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

  function taoFixture(vaiTro: string, layMot = vi.fn(() => of(hocKy))) {
    TestBed.configureTestingModule({
      imports: [HocKyChiTiet],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: String(hocKy.id) }) } },
        },
        { provide: HocKyService, useValue: { layMot } },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: vaiTro }) } },
      ],
    });
    const fixture = TestBed.createComponent(HocKyChiTiet);
    fixture.detectChanges();
    return { fixture, layMot };
  }

  it('loads the semester schedule and exposes edit action to admin only when editable', () => {
    const { fixture, layMot } = taoFixture('ADMIN');

    expect(layMot).toHaveBeenCalledWith(hocKy.id);
    expect(fixture.nativeElement.textContent).toContain(hocKy.ten_hoc_ky);
    expect(fixture.nativeElement.textContent).toContain('07/09/2026');
    expect(fixture.nativeElement.textContent).toContain('10/08/2026 08:00');
    expect(fixture.nativeElement.querySelector('.nut-sua')).not.toBeNull();
  });

  it('hides the edit action for non-admins', () => {
    const teacher = taoFixture('GIANG_VIEN');
    expect(teacher.fixture.nativeElement.querySelector('.nut-sua')).toBeNull();
  });

  it('hides the edit action for closed semesters', () => {
    const closedFixture = taoFixture(
      'ADMIN',
      vi.fn(() => of({ ...hocKy, trang_thai: 'CLOSED' as const })),
    );
    expect(closedFixture.fixture.nativeElement.querySelector('.nut-sua')).toBeNull();
  });

  it('shows the API error when semester details cannot be loaded', () => {
    const { fixture } = taoFixture(
      'ADMIN',
      vi.fn(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: 'Học kỳ không tồn tại.' },
            }),
        ),
      ),
    );

    expect(fixture.nativeElement.textContent).toContain('Học kỳ không tồn tại.');
    expect(fixture.nativeElement.querySelector('a[routerLink="/hoc-ky"]')).not.toBeNull();
  });
});
