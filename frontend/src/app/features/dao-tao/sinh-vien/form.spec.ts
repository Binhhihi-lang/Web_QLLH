import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { SinhVienForm } from './form';

describe('SinhVienForm', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SinhVienForm>>;
  let routeId: string | null;
  let service: {
    layTuyChonLop: ReturnType<typeof vi.fn>;
    layMot: ReturnType<typeof vi.fn>;
    taoMoi: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    routeId = null;
    service = {
      layTuyChonLop: vi.fn(() => of([])),
      layMot: vi.fn(),
      taoMoi: vi.fn(),
      capNhat: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [SinhVienForm],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
        { provide: SinhVienService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(SinhVienForm);
    fixture.detectChanges();
  });

  it('keeps the form open and shows required errors when key fields are empty', () => {
    fixture.componentInstance.gui(new Event('submit'));

    expect(fixture.componentInstance.daCham()).toBe(true);
    expect(service.taoMoi).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loiMaSv()).toBeTruthy();
    expect(fixture.componentInstance.loiHoTen()).toBeTruthy();
    expect(fixture.componentInstance.loiEmail()).toBeTruthy();
  });

  it('creates a student and exposes the one-time password returned by the API', () => {
    service.taoMoi.mockReturnValue(
      of({
        id: 87,
        ma_sv: 'SV000087',
        ho_ten: 'Nguyễn An',
        email: 'an@example.edu.vn',
        ngay_sinh: null,
        gioi_tinh: true,
        so_dien_thoai: null,
        dia_chi: null,
        trang_thai: true,
        lop_hanh_chinh: null,
        avatar_url: null,
        da_xoa: false,
        mat_khau_ban_dau: 'MockSV2026!!',
      }),
    );
    const form = fixture.componentInstance;
    form.maSv.set('SV000087');
    form.hoTen.set('Nguyễn An');
    form.email.set('an@example.edu.vn');

    form.gui(new Event('submit'));

    expect(service.taoMoi).toHaveBeenCalledWith(
      expect.objectContaining({
        ma_sv: 'SV000087',
        ho_ten: 'Nguyễn An',
        email: 'an@example.edu.vn',
      }),
    );
    expect(form.matKhauBanDau()).toBe('MockSV2026!!');
  });

  it('keeps the current class selected when class options arrive after the student record', () => {
    const form = fixture.componentInstance;
    form.lopId.set(1);
    fixture.detectChanges();
    form.dsLop.set([{ id: 1, label: 'CNTT-K65-01', khoa_hoc: 'K65', nganh: 'CNTT' }]);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#lop-hanh-chinh') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('loads an existing student and submits edits through the update endpoint', () => {
    const student = {
      id: 1,
      ma_sv: 'SV000001',
      ho_ten: 'Nguyễn An',
      email: 'an@example.edu.vn',
      ngay_sinh: null,
      gioi_tinh: true,
      so_dien_thoai: null,
      dia_chi: null,
      trang_thai: true,
      lop_hanh_chinh: null,
      avatar_url: null,
      da_xoa: false,
    };
    service.layMot.mockReturnValue(of(student));
    service.capNhat.mockReturnValue(of(student));
    fixture.destroy();
    routeId = '1';
    fixture = TestBed.createComponent(SinhVienForm);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    form.hoTen.set('Nguyễn An đã sửa');

    form.gui(new Event('submit'));

    expect(service.layMot).toHaveBeenCalledWith(1);
    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ho_ten: 'Nguyễn An đã sửa' }),
    );
  });

  it('traps keyboard focus inside the one-time password dialog', () => {
    const form = fixture.componentInstance;
    form.matKhauBanDau.set('MockSV2026!!');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('app-button button') as NodeListOf<HTMLButtonElement>;
    const first = buttons[0];
    const last = buttons[1];

    first.focus();
    const backward = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    form.giuFocusTrongHop(backward);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    last.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    form.giuFocusTrongHop(forward);
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });
});
