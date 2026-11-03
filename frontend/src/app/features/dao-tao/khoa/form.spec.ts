import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { KhoaForm } from './form';

describe('KhoaForm', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KhoaForm>>;
  let routeId: string | null;
  let service: {
    layKhoa: ReturnType<typeof vi.fn>;
    taoKhoa: ReturnType<typeof vi.fn>;
    capNhatKhoa: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const existing = {
    id: 1,
    ma_khoa: 'CNTT',
    ten_khoa: 'Công nghệ thông tin',
    mo_ta: 'Khối công nghệ',
    trang_thai: true,
    so_nganh: 4,
    da_xoa: false,
  };

  beforeEach(() => {
    routeId = null;
    router = { navigate: vi.fn().mockResolvedValue(true) };
    service = {
      layKhoa: vi.fn(() => of(existing)),
      taoKhoa: vi.fn(() => of(existing)),
      capNhatKhoa: vi.fn(() => of(existing)),
    };
    TestBed.configureTestingModule({
      imports: [KhoaForm],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: KhoaNganhService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(KhoaForm);
    fixture.detectChanges();
  });

  it('requires a khoa code and name before submission', () => {
    fixture.componentInstance.gui(new Event('submit'));

    expect(fixture.componentInstance.loiMaKhoa()).toBeTruthy();
    expect(fixture.componentInstance.loiTenKhoa()).toBeTruthy();
    expect(service.taoKhoa).not.toHaveBeenCalled();
  });

  it('creates a khoa with trimmed values and nullable description', () => {
    const form = fixture.componentInstance;
    form.maKhoa.set('  CNTT  ');
    form.tenKhoa.set('  Công nghệ thông tin  ');

    form.gui(new Event('submit'));

    expect(service.taoKhoa).toHaveBeenCalledWith({
      ma_khoa: 'CNTT',
      ten_khoa: 'Công nghệ thông tin',
      mo_ta: null,
      trang_thai: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/khoa']);
  });

  it('loads an existing khoa and submits edits', () => {
    fixture.destroy();
    routeId = '1';
    fixture = TestBed.createComponent(KhoaForm);
    fixture.detectChanges();
    const form = fixture.componentInstance;

    expect(form.tenKhoa()).toBe('Công nghệ thông tin');
    form.tenKhoa.set('Tên khoa đã sửa');
    form.gui(new Event('submit'));

    expect(service.capNhatKhoa).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ten_khoa: 'Tên khoa đã sửa' }),
    );
  });
});
