import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { ChuongTrinhDaoTao, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { ChuongTrinhKhungSinhVien } from './chuong-trinh-khung';

const CTDT_MOCK: ChuongTrinhDaoTao = {
  id: 1,
  ma_ctdt: 'CT-KTPM-K68',
  ten: 'Chương trình Kỹ thuật phần mềm K68',
  khoa_hoc: 'K68',
  so_nam: 4,
  so_ky: 8,
  so_mon: 3,
  tong_tin_chi: 9,
  so_mon_chua_gan_ky: 0,
  sinh_vien_ap_dung: 120,
  trang_thai: true,
  mo_ta: null,
  nganh: {
    id: 1,
    ma_nganh: 'KTPM',
    ten_nganh: 'Kỹ thuật phần mềm',
    khoa: { id: 1, ma_khoa: 'CNTT', ten_khoa: 'Công nghệ thông tin' },
  },
  mon: [
    {
      id: 101,
      ky_thu: 1,
      bat_buoc: true,
      mon_hoc: { id: 1, ma_mon: 'INT1001', ten_mon: 'Nhập môn lập trình', so_tin_chi: 3 },
    },
    {
      id: 102,
      ky_thu: 1,
      bat_buoc: false,
      mon_hoc: { id: 2, ma_mon: 'INT1002', ten_mon: 'Tin học đại cương', so_tin_chi: 3 },
    },
    {
      id: 103,
      ky_thu: 2,
      bat_buoc: true,
      mon_hoc: { id: 3, ma_mon: 'INT2001', ten_mon: 'Cấu trúc dữ liệu và giải thuật', so_tin_chi: 3 },
    },
  ],
};

describe('ChuongTrinhKhungSinhVien', () => {
  let mockChuongTrinh: { layCuaToi: ReturnType<typeof vi.fn> };
  let mockAuth: { nguoiDung: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockChuongTrinh = {
      layCuaToi: vi.fn().mockReturnValue(of(CTDT_MOCK)),
    };
    mockAuth = {
      nguoiDung: vi.fn().mockReturnValue({
        id: 10,
        vai_tro: 'SINH_VIEN',
        ho_so: { ho_ten: 'Nguyễn Văn A', ma_sv: 'SV001', khoa_hoc: 'K68' },
      }),
    };

    TestBed.configureTestingModule({
      imports: [ChuongTrinhKhungSinhVien],
      providers: [
        provideRouter([]),
        { provide: ChuongTrinhService, useValue: mockChuongTrinh },
        { provide: AuthService, useValue: mockAuth },
      ],
    });
  });

  it('khởi tạo và hiển thị thông tin chương trình khung cùng danh sách môn theo kỳ', () => {
    const fixture = TestBed.createComponent(ChuongTrinhKhungSinhVien);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('CT-KTPM-K68');
    expect(text).toContain('Chương trình Kỹ thuật phần mềm K68');
    expect(text).toContain('Học kỳ 1');
    expect(text).toContain('Học kỳ 2');
    expect(text).toContain('INT1001');
    expect(text).toContain('Nhập môn lập trình');
  });

  it('lọc môn theo loại bắt buộc', () => {
    const fixture = TestBed.createComponent(ChuongTrinhKhungSinhVien);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.loaiMonLoc.set('BAT_BUOC');
    fixture.detectChanges();

    const nhom = component.nhomKyHienThi();
    const tatCaMon = nhom.flatMap((n) => n.danhSachMon);
    expect(tatCaMon.every((m) => m.bat_buoc)).toBe(true);
    expect(tatCaMon.some((m) => m.mon_hoc.ma_mon === 'INT1002')).toBe(false);
  });
});
