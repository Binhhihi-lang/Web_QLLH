import { of, throwError } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { GiangVienService } from '@core/services/giang-vien.service';
import { GiangVienDanhSach } from './danh-sach';

describe('GiangVienDanhSach', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<GiangVienDanhSach>>;
  let service: {
    layDanhSach: ReturnType<typeof vi.fn>;
    doiTrangThaiHangLoat: ReturnType<typeof vi.fn>;
    xoaHangLoat: ReturnType<typeof vi.fn>;
    xoa: ReturnType<typeof vi.fn>;
  };

  const giangVien = {
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
  const trang = {
    data: [giangVien],
    meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
    success: true,
    message: 'Thành công',
  };

  beforeEach(() => {
    service = {
      layDanhSach: vi.fn(() => of(trang)),
      doiTrangThaiHangLoat: vi.fn(() =>
        of({ thanh_cong: 1, that_bai: 0, chi_tiet: [{ id: 1, ket_qua: 'THANH_CONG' }] }),
      ),
      xoaHangLoat: vi.fn(() =>
        of({ thanh_cong: 1, that_bai: 0, chi_tiet: [{ id: 1, ket_qua: 'THANH_CONG' }] }),
      ),
      xoa: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [GiangVienDanhSach],
      providers: [provideRouter([]), { provide: GiangVienService, useValue: service }],
    });
    fixture = TestBed.createComponent(GiangVienDanhSach);
    fixture.detectChanges();
  });

  it('loads and renders the teacher list with contact and status', () => {
    expect(service.layDanhSach).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10, sort_by: 'ma_gv', sort_dir: 'asc' }),
    );
    expect(fixture.nativeElement.textContent).toContain('GV0001');
    expect(fixture.nativeElement.textContent).toContain('an@example.edu.vn');
    expect(fixture.nativeElement.textContent).toContain('Đang hoạt động');
    expect(
      fixture.nativeElement.querySelector('app-button[routerLink="/giang-vien/them"]'),
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.nut-xem')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label="Sửa giảng viên Nguyễn Minh An"]'))
      .toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Xóa giảng viên Nguyễn Minh An"]'),
    ).toBeTruthy();
  });

  it('requires confirmation before deleting one teacher and refreshes after success', () => {
    const pageCountBefore = service.layDanhSach.mock.calls.length;

    fixture.componentInstance.hoiXoa(giangVien);
    fixture.detectChanges();

    expect(service.xoa).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Xóa giảng viên');

    fixture.componentInstance.xacNhanXoa();

    expect(service.xoa).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.canXoa()).toBeNull();
    expect(service.layDanhSach.mock.calls.length).toBeGreaterThan(pageCountBefore);
  });

  it('navigates to the edit form from the row action', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.nativeElement
      .querySelector('button[aria-label="Sửa giảng viên Nguyễn Minh An"]')
      .click();

    expect(navigate).toHaveBeenCalledWith(['/giang-vien', 1, 'sua']);
    expect(navigate).not.toHaveBeenCalledWith(['/giang-vien', 1]);
  });

  it('navigates to the teacher profile when the row is clicked', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.nativeElement.querySelector('app-data-table tbody tr').click();

    expect(navigate).toHaveBeenCalledWith(['/giang-vien', 1]);
  });

  it('keeps the delete confirmation open and explains a blocked deletion', () => {
    service.xoa.mockReturnValue(
      throwError(() => ({
        error: { message: 'Giảng viên còn phụ trách lớp thuộc học kỳ chưa đóng.' },
      })),
    );
    fixture.componentInstance.hoiXoa(giangVien);

    fixture.componentInstance.xacNhanXoa();

    expect(fixture.componentInstance.canXoa()?.id).toBe(1);
    expect(fixture.componentInstance.lyDoChanXoa()).toContain('học kỳ chưa đóng');
  });

  it('sends search and status filters to the service', () => {
    fixture.componentInstance.doiTuKhoa('Minh An');
    fixture.componentInstance.doiTrangThai({
      target: { value: 'false' },
    } as unknown as Event);
    fixture.componentInstance.apDungLoc();

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'Minh An', trang_thai: false }),
    );
  });

  it('refreshes the list after changing teacher status in bulk', () => {
    const pageCountBefore = service.layDanhSach.mock.calls.length;
    fixture.componentInstance.daChon.set([1]);

    fixture.componentInstance.hangLoat(false);

    expect(service.doiTrangThaiHangLoat).toHaveBeenCalledWith([1], false);
    expect(fixture.componentInstance.ketQuaHangLoat()?.thanh_cong).toBe(1);
    expect(fixture.componentInstance.daChon()).toEqual([]);
    expect(service.layDanhSach.mock.calls.length).toBeGreaterThan(pageCountBefore);
  });

  it('keeps blocked teachers selected and shows each deletion failure', () => {
    service.xoaHangLoat.mockReturnValue(
      of({
        thanh_cong: 0,
        that_bai: 1,
        chi_tiet: [
          {
            id: 1,
            ket_qua: 'THAT_BAI',
            ma_loi: 'DELETE_BLOCKED',
            message: 'Giảng viên còn phụ trách lớp học phần thuộc học kỳ chưa đóng.',
          },
        ],
      }),
    );
    fixture.componentInstance.daChon.set([1]);
    fixture.componentInstance.hoiXoaHangLoat();

    fixture.componentInstance.xacNhanXoaHangLoat();

    expect(fixture.componentInstance.canXoaHangLoat()).toBe(false);
    expect(fixture.componentInstance.daChon()).toEqual([1]);
    expect(fixture.componentInstance.dongLoi()[0].message).toContain('học kỳ chưa đóng');
  });

  it('requires confirmation before bulk deletion', () => {
    fixture.componentInstance.daChon.set([1]);
    fixture.componentInstance.hoiXoaHangLoat();

    expect(service.xoaHangLoat).not.toHaveBeenCalled();
    expect(fixture.componentInstance.canXoaHangLoat()).toBe(true);

    fixture.componentInstance.xacNhanXoaHangLoat();

    expect(service.xoaHangLoat).toHaveBeenCalledWith([1]);
    expect(fixture.componentInstance.canXoaHangLoat()).toBe(false);
  });
});
