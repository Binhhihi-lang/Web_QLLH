import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { NguoiDungQuanTri, NguoiDungService } from '@core/services/nguoi-dung.service';
import { NguoiDungDanhSach } from './danh-sach';

describe('NguoiDungDanhSach', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<NguoiDungDanhSach>>;
  let service: {
    layDanhSach: ReturnType<typeof vi.fn>;
    doiTrangThaiHangLoat: ReturnType<typeof vi.fn>;
    xoa: ReturnType<typeof vi.fn>;
    datLaiMatKhau: ReturnType<typeof vi.fn>;
  };

  const users: NguoiDungQuanTri[] = [
    {
      id: 1,
      name: 'Quản trị viên hiện tại',
      email: 'admin@qllh.test',
      avatar_url: null,
      vai_tro: 'ADMIN',
      trang_thai: true,
      must_change_password: false,
      ho_so: null,
    },
    {
      id: 2,
      name: 'Giảng viên',
      email: 'teacher@example.edu.vn',
      avatar_url: null,
      vai_tro: 'GIANG_VIEN',
      trang_thai: true,
      must_change_password: false,
      ho_so: null,
    },
    {
      id: 3,
      name: 'Quản trị viên khác',
      email: 'admin2@example.edu.vn',
      avatar_url: null,
      vai_tro: 'ADMIN',
      trang_thai: false,
      must_change_password: false,
      ho_so: null,
    },
  ];

  beforeEach(() => {
    service = {
      layDanhSach: vi.fn(() =>
        of({
          success: true,
          message: 'Thành công',
          data: users,
          meta: { current_page: 1, per_page: 10, total: users.length, last_page: 1 },
          links: { first: null, prev: null, next: null, last: null },
        }),
      ),
      doiTrangThaiHangLoat: vi.fn(() =>
        of({
          thanh_cong: 1,
          that_bai: 1,
          chi_tiet: [
            { id: 2, ket_qua: 'THANH_CONG' },
            { id: 3, ket_qua: 'THAT_BAI', ma_loi: 'FORBIDDEN', message: 'Không thể cập nhật.' },
          ],
        }),
      ),
      xoa: vi.fn(() => of(undefined)),
      datLaiMatKhau: vi.fn(() => of({ ...users[2], mat_khau_moi: 'temporary-password' })),
    };
    TestBed.configureTestingModule({
      imports: [NguoiDungDanhSach],
      providers: [
        provideRouter([]),
        { provide: NguoiDungService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: signal(users[0]) } },
      ],
    });
    fixture = TestBed.createComponent(NguoiDungDanhSach);
    fixture.detectChanges();
  });

  it('loads the accounts and limits deletion to other administrator accounts', () => {
    expect(service.layDanhSach).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('teacher@example.edu.vn');
    expect(fixture.nativeElement.querySelectorAll('button.nut-xoa')).toHaveLength(1);
  });

  it('renders account actions as buttons rather than links', () => {
    const actions = fixture.nativeElement.querySelectorAll(
      'app-data-table tbody td:last-child button',
    );

    expect(actions.length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelectorAll('app-data-table tbody td:last-child a'),
    ).toHaveLength(0);
    expect(
      Array.from(actions as NodeListOf<HTMLButtonElement>).every((button) =>
        button.classList.contains('nut-hanh-dong'),
      ),
    ).toBe(true);
  });

  it('gives search and select filters a shared visible label row', () => {
    const filterLabels = fixture.nativeElement.querySelectorAll('.thanh-loc > label.loc');

    expect(filterLabels).toHaveLength(3);
    expect(filterLabels[0].textContent).toContain('Tìm kiếm');
    expect(filterLabels[0].querySelector('app-search-input')).not.toBeNull();
  });

  it('shows per-account errors returned by bulk status updates', () => {
    const component = fixture.componentInstance;
    component.daChon.set([2, 3]);
    component.capNhatTrangThaiHangLoat(false);
    fixture.detectChanges();

    expect(service.doiTrangThaiHangLoat).toHaveBeenCalledWith([2, 3], false);
    expect(component.thongBao()?.muc).toBe('warning');
    expect(fixture.nativeElement.textContent).toContain('Không thể cập nhật.');
  });

  it('navigates to the edit form for the selected account', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.moChinhSua(users[1]);

    expect(navigate).toHaveBeenCalledWith(['/nguoi-dung', 2, 'sua']);
  });
});
