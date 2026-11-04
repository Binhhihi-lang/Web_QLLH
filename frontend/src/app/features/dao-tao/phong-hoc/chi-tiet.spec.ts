import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { PhongHocService } from './phong-hoc.service';
import { PhongHocChiTiet } from './chi-tiet';

describe('PhongHocChiTiet', () => {
  it('loads the room details and offers an edit route to admins', () => {
    const room = {
      id: 1,
      ma_phong: 'A101',
      ten_phong: 'Phòng học A101',
      suc_chua: 40,
      trang_thai: true,
      da_xoa: false,
    };
    const service = { layMot: vi.fn(() => of(room)) };
    TestBed.configureTestingModule({
      imports: [PhongHocChiTiet],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
        { provide: PhongHocService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(PhongHocChiTiet);
    fixture.detectChanges();

    expect(service.layMot).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('A101');
    expect(fixture.nativeElement.textContent).toContain('Phòng học A101');
    expect(fixture.nativeElement.textContent).toContain('40 chỗ');
    expect(fixture.nativeElement.querySelector('a[href="/phong-hoc/1/sua"]')).toBeTruthy();
  });

  it('shows an error when the room cannot be loaded', () => {
    const service = {
      layMot: vi.fn(() => ({
        subscribe: ({ error }: { error: () => void }) => error(),
      })),
    };
    TestBed.configureTestingModule({
      imports: [PhongHocChiTiet],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '999' } } },
        },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'TEACHER' }) } },
        { provide: PhongHocService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(PhongHocChiTiet);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Không tải được thông tin phòng học.');
    expect(fixture.nativeElement.querySelector('a[href="/phong-hoc/999/sua"]')).toBeNull();
  });
});
