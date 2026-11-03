import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NguoiDungService } from '@core/services/nguoi-dung.service';
import { NguoiDungForm } from './form';

describe('NguoiDungForm', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<NguoiDungForm>>;
  let routeId: string | null;
  let service: {
    layMot: ReturnType<typeof vi.fn>;
    taoMoi: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    routeId = null;
    service = {
      layMot: vi.fn(),
      taoMoi: vi.fn(),
      capNhat: vi.fn(),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [NguoiDungForm],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: NguoiDungService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(NguoiDungForm);
    fixture.detectChanges();
  });

  it('requires a valid name, email and role before creating an account', () => {
    fixture.componentInstance.luu(new Event('submit'));
    fixture.detectChanges();

    expect(service.taoMoi).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loiTruong('name')).toBeTruthy();
    expect(fixture.componentInstance.loiTruong('email')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Vui lòng chọn vai trò.');
  });

  it('creates an account and exposes its one-time password', () => {
    service.taoMoi.mockReturnValue(
      of({
        id: 8,
        name: 'Giảng viên mới',
        email: 'new@example.edu.vn',
        avatar_url: null,
        vai_tro: 'GIANG_VIEN',
        trang_thai: true,
        must_change_password: true,
        ho_so: null,
        mat_khau_ban_dau: 'temporary-password',
      }),
    );
    const form = fixture.componentInstance;
    form.name.set('Giảng viên mới');
    form.email.set('new@example.edu.vn');
    form.vaiTro.set('GIANG_VIEN');

    form.luu(new Event('submit'));

    expect(service.taoMoi).toHaveBeenCalledWith({
      name: 'Giảng viên mới',
      email: 'new@example.edu.vn',
      vai_tro: 'GIANG_VIEN',
      trang_thai: true,
    });
    expect(form.matKhauBanDau()).toBe('temporary-password');
  });

  it('loads and updates an existing user', () => {
    const user = {
      id: 4,
      name: 'Người dùng hiện tại',
      email: 'user@example.edu.vn',
      avatar_url: null,
      vai_tro: 'ADMIN' as const,
      trang_thai: true,
      must_change_password: false,
      ho_so: null,
    };
    service.layMot.mockReturnValue(of(user));
    service.capNhat.mockReturnValue(of(user));
    fixture.destroy();
    routeId = '4';
    fixture = TestBed.createComponent(NguoiDungForm);
    fixture.detectChanges();

    expect(service.layMot).toHaveBeenCalledWith(4);
    fixture.componentInstance.name.set('Người dùng đã sửa');
    fixture.componentInstance.luu(new Event('submit'));

    expect(service.capNhat).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ name: 'Người dùng đã sửa', vai_tro: 'ADMIN' }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/nguoi-dung']);
  });

  it('does not open a creation form for an invalid edit id', () => {
    fixture.destroy();
    routeId = '0';
    fixture = TestBed.createComponent(NguoiDungForm);
    fixture.detectChanges();

    expect(fixture.componentInstance.dangSua()).toBe(true);
    expect(fixture.componentInstance.loiTai()).toContain('không hợp lệ');
    expect(service.taoMoi).not.toHaveBeenCalled();
  });

  it('traps keyboard focus inside the one-time password dialog', () => {
    fixture.componentInstance.matKhauBanDau.set('temporary-password');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'app-button button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0].focus();
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });

    fixture.componentInstance.giuFocusTrongHop(backward);

    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[1]);
  });
});
