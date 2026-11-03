import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { MonHocService } from './mon-hoc.service';
import { MonHocDanhSach } from './danh-sach';
import { MonHocForm } from './form';

describe('Môn học theo Khoa', () => {
  it('filters the subject list by khoa_id', () => {
    const service = {
      layDanhSach: vi.fn(() => of({
        data: [],
        meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 },
        links: { first: null, prev: null, next: null, last: null },
        success: true,
        message: 'Thành công',
      })),
      layTuyChonKhoa: vi.fn(() => of([{ id: 2, label: 'Điện tử viễn thông', ma_khoa: 'DTVT' }])),
    };
    TestBed.configureTestingModule({
      imports: [MonHocDanhSach],
      providers: [
        provideRouter([]),
        { provide: MonHocService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'ADMIN' }) } },
      ],
    });
    const fixture = TestBed.createComponent(MonHocDanhSach);
    fixture.detectChanges();

    fixture.componentInstance.doiLocKhoa({
      target: { value: '2' },
    } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({ khoa_id: 2, page: 1 }),
    );
    fixture.destroy();
  });

  it('loads khoa options and submits khoa_id with the subject form', () => {
    const service = {
      layTuyChonKhoa: vi.fn(() => of([{ id: 2, label: 'Điện tử viễn thông', ma_khoa: 'DTVT' }])),
      taoMoi: vi.fn(() => of({ id: 9 })),
      layMot: vi.fn(),
      capNhat: vi.fn(),
    };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [MonHocForm],
      providers: [
        { provide: MonHocService, useValue: service },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    });
    const fixture = TestBed.createComponent(MonHocForm);
    fixture.detectChanges();
    const form = fixture.componentInstance;

    expect(service.layTuyChonKhoa).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Điện tử viễn thông');
    form.maMon.set('INT3300');
    form.tenMon.set('Môn mới');
    form.khoaId.set(2);
    form.gui(new Event('submit'));

    expect(service.taoMoi).toHaveBeenCalledWith(
      expect.objectContaining({ ma_mon: 'INT3300', khoa_id: 2 }),
    );
    fixture.destroy();
  });

  it('does not duplicate the inactive khoa label when options load after the subject', () => {
    const options = new Subject<{ id: number; label: string; ma_khoa: string }[]>();
    const service = {
      layTuyChonKhoa: vi.fn(() => options),
      layMot: vi.fn(() => of({
        id: 9,
        ma_mon: 'INT3300',
        khoa_id: 2,
        khoa: { id: 2, ma_khoa: 'DTVT', ten_khoa: 'Điện tử viễn thông' },
        ten_mon: 'Môn đã có',
        so_tin_chi: 3,
        mo_ta: null,
        trang_thai: true,
        da_xoa: false,
      })),
      taoMoi: vi.fn(),
      capNhat: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [MonHocForm],
      providers: [
        { provide: MonHocService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '9' } } } },
      ],
    });
    const fixture = TestBed.createComponent(MonHocForm);
    fixture.detectChanges();

    options.next([{ id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' }]);

    expect(
      fixture.componentInstance.dsKhoa().find((khoa) => khoa.id === 2)?.label,
    ).toBe('Điện tử viễn thông (đã khóa)');
    fixture.destroy();
  });
});
