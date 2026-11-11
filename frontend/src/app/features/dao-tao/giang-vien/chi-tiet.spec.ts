import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { GiangVienService } from '@core/services/giang-vien.service';
import { GiangVienChiTiet } from './chi-tiet';

/** Tài khoản giả — chỉ những trường component đọc. */
function taiKhoan(vai_tro: 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN', hoSoId?: number) {
  return {
    vai_tro,
    ho_so: hoSoId === undefined ? null : { loai: 'giang_vien', id: hoSoId },
  };
}

const teacherDayDu = {
  id: 1,
  ma_gv: 'GV0001',
  ho_ten: 'Nguyễn Minh An',
  email: 'an@example.edu.vn',
  so_dien_thoai: '0912345678',
  nganh_id: 1,
  nganh: { id: 1, ma_nganh: 'KTPM', ten_nganh: 'Công nghệ phần mềm', khoa_id: 1 },
  trang_thai: true,
  avatar_url: null,
  da_xoa: false,
};

/** Đúng những gì `GiangVienLienHeResource` trả cho sinh viên. */
const teacherLienHe = {
  id: 1,
  ma_gv: 'GV0001',
  ho_ten: 'Nguyễn Minh An',
  email: 'an@example.edu.vn',
  so_dien_thoai: '0912345678',
  avatar_url: null,
};

function dung(
  duLieu: unknown,
  vai_tro: 'ADMIN' | 'GIANG_VIEN' | 'SINH_VIEN' = 'ADMIN',
  hoSoId?: number,
) {
  const service = { layMotLienHe: vi.fn(() => of(duLieu)) };
  TestBed.configureTestingModule({
    imports: [GiangVienChiTiet],
    providers: [
      provideRouter([]),
      { provide: GiangVienService, useValue: service },
      { provide: AuthService, useValue: { nguoiDung: () => taiKhoan(vai_tro, hoSoId) } },
    ],
  });
  const fixture = TestBed.createComponent(GiangVienChiTiet);
  fixture.componentRef.setInput('id', 1);
  fixture.detectChanges();

  return { fixture, service };
}

describe('GiangVienChiTiet', () => {
  it('loads and displays the teacher profile and offers an edit route', () => {
    const { fixture, service } = dung(teacherDayDu);

    expect(service.layMotLienHe).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('GV0001');
    expect(fixture.nativeElement.textContent).toContain('an@example.edu.vn');
    expect(fixture.nativeElement.textContent).toContain('Công nghệ phần mềm');
    expect(fixture.nativeElement.querySelector('a[href="/giang-vien/1/sua"]')).toBeTruthy();
  });

  it('shows an error when the teacher cannot be loaded', () => {
    TestBed.configureTestingModule({
      imports: [GiangVienChiTiet],
      providers: [
        provideRouter([]),
        {
          provide: GiangVienService,
          useValue: { layMotLienHe: () => ({ subscribe: ({ error }: { error: () => void }) => error() }) },
        },
        { provide: AuthService, useValue: { nguoiDung: () => taiKhoan('ADMIN') } },
      ],
    });
    const fixture = TestBed.createComponent(GiangVienChiTiet);
    fixture.componentRef.setInput('id', 999);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Không tải được thông tin giảng viên.');
  });

  it('sinh viên chỉ thấy khối liên hệ, không thấy nút Sửa hay thông tin công tác', () => {
    const { fixture } = dung(teacherLienHe, 'SINH_VIEN');

    expect(fixture.nativeElement.textContent).toContain('an@example.edu.vn');
    expect(fixture.nativeElement.querySelector('a[href="/giang-vien/1/sua"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Thông tin công tác');
    expect(fixture.nativeElement.textContent).not.toContain('Trạng thái tài khoản');
  });

  it('giảng viên xem hồ sơ người khác thì không thấy nút Sửa', () => {
    const { fixture } = dung(teacherDayDu, 'GIANG_VIEN', 99);

    expect(fixture.nativeElement.querySelector('a[href="/giang-vien/1/sua"]')).toBeNull();
    // Vẫn thấy thông tin công tác vì giảng viên nhận đủ hồ sơ.
    expect(fixture.nativeElement.textContent).toContain('Thông tin công tác');
  });

  it('giảng viên xem hồ sơ của chính mình thì thấy nút Sửa', () => {
    const { fixture } = dung(teacherDayDu, 'GIANG_VIEN', 1);

    expect(fixture.nativeElement.querySelector('a[href="/giang-vien/1/sua"]')).toBeTruthy();
  });
});
