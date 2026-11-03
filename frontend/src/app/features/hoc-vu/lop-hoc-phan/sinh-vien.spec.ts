import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhanService, SinhVienLop } from '@core/services/lop-hoc-phan.service';
import { LopHocPhanSinhVien } from './sinh-vien';

describe('LopHocPhanSinhVien — tìm kiếm trong danh sách lớp', () => {
  let component: LopHocPhanSinhVien;
  let fixture: ComponentFixture<LopHocPhanSinhVien>;
  let mockService: {
    laySinhVien: () => any;
    huyDangKy: (id: number, lyDo: string) => any;
  };
  let daHuy: Array<{ id: number; lyDo: string }>;

  function sinhVien(
    id: number,
    maSv: string,
    hoTen: string,
    lop: string | null = 'CNTT-K65',
  ): SinhVienLop {
    return {
      id,
      ma_sv: maSv,
      ho_ten: hoTen,
      email: `${maSv.toLowerCase()}@example.com`,
      lop,
      dang_ky_hoc_phan_id: id,
    };
  }

  async function taoTrang(danhSach: SinhVienLop[], vaiTro = 'ADMIN') {
    daHuy = [];
    mockService = {
      laySinhVien: () => of(danhSach),
      huyDangKy: (id: number, lyDo: string) => {
        daHuy.push({ id, lyDo });
        return of({ success: true, message: 'Đã hủy.' });
      },
    };

    await TestBed.configureTestingModule({
      imports: [LopHocPhanSinhVien],
      providers: [
        { provide: LopHocPhanService, useValue: mockService },
        { provide: AuthService, useValue: { nguoiDung: signal({ vai_tro: vaiTro }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '7' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LopHocPhanSinhVien);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => vi.restoreAllMocks());

  it('tải được danh sách và mặc định hiện đủ', async () => {
    await taoTrang([
      sinhVien(1, 'SV000001', 'Nguyễn Văn An'),
      sinhVien(2, 'SV000002', 'Trần Thị B'),
    ]);

    expect(component.rows().length).toBe(2);
    expect(component.rowsHienThi().length).toBe(2);
    expect(component.dangLoc()).toBe(false);
  });

  it('lọc theo họ tên gõ không dấu vẫn khớp, kể cả chữ đ', async () => {
    await taoTrang([
      sinhVien(1, 'SV000001', 'Nguyễn Văn An'),
      sinhVien(2, 'SV000002', 'Đặng Thị Đào'),
    ]);

    component.tuKhoa.set('dang thi dao');
    expect(component.rowsHienThi().length).toBe(1);
    expect(component.rowsHienThi()[0].ma_sv).toBe('SV000002');
  });

  it('lọc được theo mã sinh viên, email và lớp hành chính', async () => {
    await taoTrang([
      sinhVien(1, 'SV000001', 'Nguyễn Văn An', 'CNTT-K65'),
      sinhVien(2, 'SV000002', 'Trần Thị B', 'KT-K65'),
    ]);

    component.tuKhoa.set('sv000001');
    expect(component.rowsHienThi().length).toBe(1);

    component.tuKhoa.set('kt-k65');
    expect(component.rowsHienThi().length).toBe(1);
    expect(component.rowsHienThi()[0].ho_ten).toBe('Trần Thị B');

    component.tuKhoa.set('@example.com');
    expect(component.rowsHienThi().length).toBe(2);
  });

  it('đổi thông báo rỗng theo trạng thái lọc', async () => {
    await taoTrang([sinhVien(1, 'SV000001', 'Nguyễn Văn An')]);

    component.tuKhoa.set('');
    expect(component.tieuDeRong()).toBe('Chưa có sinh viên');

    component.tuKhoa.set('khong-co-ai');
    expect(component.tieuDeRong()).toBe('Không tìm thấy sinh viên');
    expect(component.moTaRong()).toContain('khong-co-ai');
  });

  it('khoảng trắng thôi không tính là đang lọc', async () => {
    await taoTrang([sinhVien(1, 'SV000001', 'Nguyễn Văn An')]);

    component.tuKhoa.set('   ');
    expect(component.dangLoc()).toBe(false);
    expect(component.rowsHienThi().length).toBe(1);
  });

  it('đang lọc vẫn hủy được đăng ký của dòng không nhìn thấy', async () => {
    await taoTrang([
      sinhVien(1, 'SV000001', 'Nguyễn Văn An'),
      sinhVien(2, 'SV000002', 'Trần Thị B'),
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue('Đăng ký trùng');

    component.tuKhoa.set('Nguyễn');
    expect(component.rowsHienThi().length).toBe(1);

    // Hủy dòng thứ hai — dòng này đang bị ẩn bởi bộ lọc nhưng vẫn phải hủy được.
    component.huy(component.rows()[1]);

    expect(daHuy).toEqual([{ id: 2, lyDo: 'Đăng ký trùng' }]);
  });

  it('không hiện ô tìm kiếm khi lớp chưa có sinh viên', async () => {
    await taoTrang([]);

    const than = fixture.nativeElement as HTMLElement;
    expect(than.querySelector('app-search-input')).toBeNull();
  });
});
