import { ActivatedRoute, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { KhoaChiTiet } from './chi-tiet';

describe('KhoaChiTiet', () => {
  it('loads and displays the khoa information and edit action', () => {
    const service = {
      layKhoa: vi.fn(() =>
        of({
          id: 2,
          ma_khoa: 'DTVT',
          ten_khoa: 'Điện tử viễn thông',
          mo_ta: 'Khoa điện tử',
          trang_thai: true,
          so_nganh: 3,
          da_xoa: false,
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [KhoaChiTiet],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
        { provide: KhoaNganhService, useValue: service },
      ],
    });

    const fixture = TestBed.createComponent(KhoaChiTiet);
    fixture.detectChanges();

    expect(service.layKhoa).toHaveBeenCalledWith(2);
    expect(fixture.nativeElement.textContent).toContain('Điện tử viễn thông');
    expect(fixture.nativeElement.textContent).toContain('DTVT');
    expect(fixture.nativeElement.textContent).toContain('Khoa điện tử');
    expect(fixture.nativeElement.textContent).toContain('3');
    expect(fixture.nativeElement.textContent).toContain('Đang hoạt động');
    expect(fixture.nativeElement.querySelector('a[href="/khoa/2/sua"]')).not.toBeNull();
    fixture.destroy();
  });
});
