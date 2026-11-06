import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { GiangVien, NguoiDung, SinhVien } from '@core/models/dao-tao.model';
import { GiangVienService } from '@core/services/giang-vien.service';
import { SinhVienService } from '@core/services/sinh-vien.service';
import { TaiKhoanPage } from './tai-khoan';

describe('TaiKhoanPage', () => {
  it('shows a student profile and submits only editable contact fields', () => {
    const nguoiDung: NguoiDung = {
      id: 3,
      name: 'Nguyễn Minh An',
      email: 'an@student.edu.vn',
      avatar_url: null,
      vai_tro: 'SINH_VIEN',
      trang_thai: true,
      must_change_password: false,
      ho_so: {
        loai: 'sinh_vien',
        id: 17,
        ho_ten: 'Nguyễn Minh An',
        ma_sv: 'SV00017',
        lop_hanh_chinh_id: 2,
      },
    };
    const hoSo: SinhVien = {
      id: 17,
      ma_sv: 'SV00017',
      ho_ten: 'Nguyễn Minh An',
      ngay_sinh: '2005-04-12',
      gioi_tinh: true,
      email: 'an@student.edu.vn',
      so_dien_thoai: '0900000000',
      dia_chi: 'Hà Nội',
      trang_thai: true,
      lop_hanh_chinh: { id: 2, ma_lop: 'CNTT-K66-01', ten_lop: 'CNTT-K66-01' },
      avatar_url: null,
      da_xoa: false,
    };
    const auth = {
      nguoiDung: signal(nguoiDung),
      layNguoiDung: vi.fn(() => of(nguoiDung)),
      capNhatHoSo: vi.fn(() => of(nguoiDung)),
    };
    const sinhVienService = { layMot: vi.fn(() => of(hoSo)) };

    TestBed.configureTestingModule({
      imports: [TaiKhoanPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: GiangVienService, useValue: { layMot: vi.fn() } },
        { provide: SinhVienService, useValue: sinhVienService },
      ],
    });

    const fixture = TestBed.createComponent(TaiKhoanPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('SV00017');
    expect(fixture.nativeElement.textContent).toContain('CNTT-K66-01');
    expect(sinhVienService.layMot).toHaveBeenCalledWith(17);

    fixture.componentInstance.soDienThoai.set('0912345678');
    fixture.componentInstance.diaChi.set('Đà Nẵng');
    fixture.componentInstance.luuHoSo(new Event('submit'));

    expect(auth.capNhatHoSo).toHaveBeenCalledWith({
      so_dien_thoai: '0912345678',
      dia_chi: 'Đà Nẵng',
    });
  });

  it('loads the teacher profile and does not expose identity fields for editing', () => {
    const nguoiDung: NguoiDung = {
      id: 2,
      name: 'Trần Minh Bình',
      email: 'binh@example.edu.vn',
      avatar_url: null,
      vai_tro: 'GIANG_VIEN',
      trang_thai: true,
      must_change_password: false,
      ho_so: {
        loai: 'giang_vien',
        id: 9,
        ho_ten: 'Trần Minh Bình',
        ma_gv: 'GV0009',
        nganh_id: 1,
      },
    };
    const giangVien: GiangVien = {
      id: 9,
      ma_gv: 'GV0009',
      ho_ten: 'Trần Minh Bình',
      email: 'binh@example.edu.vn',
      so_dien_thoai: null,
      nganh_id: 1,
      nganh: null,
      trang_thai: true,
      avatar_url: null,
      da_xoa: false,
    };
    const auth = {
      nguoiDung: signal(nguoiDung),
      layNguoiDung: vi.fn(() => of(nguoiDung)),
      capNhatHoSo: vi.fn(() => of(nguoiDung)),
    };

    TestBed.configureTestingModule({
      imports: [TaiKhoanPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: GiangVienService, useValue: { layMot: vi.fn(() => of(giangVien)) } },
        { provide: SinhVienService, useValue: { layMot: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(TaiKhoanPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('GV0009');
    expect(fixture.nativeElement.querySelector('input[name="name"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[name="email"]')).toBeNull();
  });
});
