import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GiangVienService } from '@core/services/giang-vien.service';
import { GiangVienForm } from './form';

describe('GiangVienForm', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<GiangVienForm>>;
  let routeId: string | null;
  let service: {
    layMot: ReturnType<typeof vi.fn>;
    taoMoi: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const existingTeacher = {
    id: 1,
    ma_gv: 'GV0001',
    ho_ten: 'Nguyễn Minh An',
    email: 'an@example.edu.vn',
    so_dien_thoai: '0912345678',
    chuyen_mon: 'Công nghệ phần mềm',
    trang_thai: true,
    avatar_url: null,
    da_xoa: false,
  };

  beforeEach(() => {
    routeId = null;
    router = { navigate: vi.fn().mockResolvedValue(true) };
    service = {
      layMot: vi.fn(),
      taoMoi: vi.fn(() => of({ ...existingTeacher, mat_khau_ban_dau: 'MockGV2026!!' })),
      capNhat: vi.fn(() => of(existingTeacher)),
    };
    TestBed.configureTestingModule({
      imports: [GiangVienForm],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
        { provide: GiangVienService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(GiangVienForm);
    fixture.detectChanges();
  });

  it('requires a teacher code, name and valid email before sending', () => {
    fixture.componentInstance.gui(new Event('submit'));

    expect(fixture.componentInstance.daCham()).toBe(true);
    expect(fixture.componentInstance.loiMaGv()).toBeTruthy();
    expect(fixture.componentInstance.loiHoTen()).toBeTruthy();
    expect(fixture.componentInstance.loiEmail()).toBeTruthy();
    expect(service.taoMoi).not.toHaveBeenCalled();
  });

  it('creates a teacher and exposes the one-time password', () => {
    const form = fixture.componentInstance;
    form.maGv.set('GV-MOI');
    form.hoTen.set('Giảng viên mới');
    form.email.set('gv-moi@example.edu.vn');

    form.gui(new Event('submit'));

    expect(service.taoMoi).toHaveBeenCalledWith(
      expect.objectContaining({
        ma_gv: 'GV-MOI',
        ho_ten: 'Giảng viên mới',
        email: 'gv-moi@example.edu.vn',
      }),
    );
    expect(form.matKhauBanDau()).toBe('MockGV2026!!');
  });

  it('loads an existing teacher and submits edits', () => {
    service.layMot.mockReturnValue(of(existingTeacher));
    fixture.destroy();
    routeId = '1';
    fixture = TestBed.createComponent(GiangVienForm);
    fixture.detectChanges();

    const form = fixture.componentInstance;
    expect(form.maGv()).toBe('GV0001');
    form.hoTen.set('Tên đã sửa');
    form.gui(new Event('submit'));

    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ho_ten: 'Tên đã sửa' }),
    );
  });

  it('shows API validation feedback for duplicate teacher codes', () => {
    service.taoMoi.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              message: 'Mã giảng viên này đã tồn tại.',
              errors: { ma_gv: ['Mã giảng viên này đã tồn tại.'] },
            },
          }),
      ),
    );
    const form = fixture.componentInstance;
    form.maGv.set('GV0001');
    form.hoTen.set('Tên mới');
    form.email.set('new@example.edu.vn');

    form.gui(new Event('submit'));

    expect(form.loiChung()).toBe('Mã giảng viên này đã tồn tại.');
    expect(form.loiMaGv()).toBe('Mã giảng viên này đã tồn tại.');
  });
});
