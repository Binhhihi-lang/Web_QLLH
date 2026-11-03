import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { NganhForm } from './form';

describe('NganhForm', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<NganhForm>>;
  let routeId: string | null;
  let service: {
    layNganh: ReturnType<typeof vi.fn>;
    taoNganh: ReturnType<typeof vi.fn>;
    capNhatNganh: ReturnType<typeof vi.fn>;
    layTuyChonKhoa: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const existing = {
    id: 1,
    khoa_id: 2,
    khoa: { id: 2, ma_khoa: 'DTVT', ten_khoa: 'Điện tử viễn thông' },
    ma_nganh: 'MTTT',
    ten_nganh: 'Mạng và truyền thông',
    mo_ta: null,
    trang_thai: true,
    da_xoa: false,
  };

  beforeEach(() => {
    routeId = null;
    router = { navigate: vi.fn().mockResolvedValue(true) };
    service = {
      layNganh: vi.fn(() => of(existing)),
      taoNganh: vi.fn(() => of(existing)),
      capNhatNganh: vi.fn(() => of(existing)),
      layTuyChonKhoa: vi.fn(() =>
        of([
          { id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' },
          { id: 2, label: 'Điện tử viễn thông', ma_khoa: 'DTVT' },
        ]),
      ),
    };
    TestBed.configureTestingModule({
      imports: [NganhForm],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: KhoaNganhService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(NganhForm);
    fixture.detectChanges();
  });

  it('requires a parent khoa, code and name before submission', () => {
    fixture.componentInstance.gui(new Event('submit'));

    expect(fixture.componentInstance.loiKhoa()).toBeTruthy();
    expect(fixture.componentInstance.loiMaNganh()).toBeTruthy();
    expect(fixture.componentInstance.loiTenNganh()).toBeTruthy();
    expect(service.taoNganh).not.toHaveBeenCalled();
  });

  it('creates an ngành attached to the selected khoa', () => {
    const form = fixture.componentInstance;
    form.khoaId.set(1);
    form.maNganh.set(' KTPM ');
    form.tenNganh.set(' Công nghệ phần mềm ');

    form.gui(new Event('submit'));

    expect(service.taoNganh).toHaveBeenCalledWith({
      khoa_id: 1,
      ma_nganh: 'KTPM',
      ten_nganh: 'Công nghệ phần mềm',
      mo_ta: null,
      trang_thai: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/nganh']);
  });

  it('loads an existing ngành and keeps its parent khoa selected', () => {
    fixture.destroy();
    routeId = '1';
    fixture = TestBed.createComponent(NganhForm);
    fixture.detectChanges();

    expect(fixture.componentInstance.khoaId()).toBe(2);
    expect(fixture.componentInstance.tenNganh()).toBe('Mạng và truyền thông');
  });

  it('does not duplicate the inactive label when khoa options arrive after the ngành', () => {
    fixture.destroy();
    routeId = '1';
    const options = new Subject<{ id: number; label: string; ma_khoa: string }[]>();
    service.layTuyChonKhoa.mockReturnValue(options);
    fixture = TestBed.createComponent(NganhForm);
    fixture.detectChanges();

    options.next([{ id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' }]);

    expect(
      fixture.componentInstance.dsKhoa().find((khoa) => khoa.id === 2)?.label,
    ).toBe('Điện tử viễn thông (đã khóa)');
  });
});
