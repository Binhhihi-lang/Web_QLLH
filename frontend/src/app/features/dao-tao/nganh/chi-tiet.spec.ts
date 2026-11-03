import { ActivatedRoute, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { NganhChiTiet } from './chi-tiet';

describe('NganhChiTiet', () => {
  it('loads and displays the ngành and its parent khoa', () => {
    const service = {
      layNganh: vi.fn(() =>
        of({
          id: 4,
          khoa_id: 2,
          khoa: { id: 2, ma_khoa: 'DTVT', ten_khoa: 'Điện tử viễn thông' },
          ma_nganh: 'MTTT',
          ten_nganh: 'Mạng và truyền thông',
          mo_ta: 'Hạ tầng viễn thông',
          trang_thai: true,
          da_xoa: false,
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [NganhChiTiet],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4' } } } },
        { provide: KhoaNganhService, useValue: service },
      ],
    });

    const fixture = TestBed.createComponent(NganhChiTiet);
    fixture.detectChanges();

    expect(service.layNganh).toHaveBeenCalledWith(4);
    expect(fixture.nativeElement.textContent).toContain('Mạng và truyền thông');
    expect(fixture.nativeElement.textContent).toContain('MTTT');
    expect(fixture.nativeElement.textContent).toContain('Điện tử viễn thông');
    expect(fixture.nativeElement.textContent).toContain('Hạ tầng viễn thông');
    expect(fixture.nativeElement.textContent).toContain('Đang hoạt động');
    expect(fixture.nativeElement.querySelector('a[href="/nganh/4/sua"]')).not.toBeNull();
    fixture.destroy();
  });
});
