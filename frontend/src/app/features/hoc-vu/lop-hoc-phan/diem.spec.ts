import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { DongDiem, LopHocPhanService, SinhVienLop } from '@core/services/lop-hoc-phan.service';
import { DiemService } from '../diem/diem.service';
import { LopHocPhanDiem } from './diem';

describe('LopHocPhanDiem — tìm kiếm trong bảng điểm', () => {
  let component: LopHocPhanDiem;
  let fixture: ComponentFixture<LopHocPhanDiem>;
  let mockService: {
    layMot: () => any;
    layDiem: () => any;
    capNhatDiem: (id: number, diem: DongDiem[]) => any;
    chotDiem: () => any;
  };

  function sinhVien(id: number, maSv: string, hoTen: string): SinhVienLop {
    return {
      id,
      ma_sv: maSv,
      ho_ten: hoTen,
      email: `${maSv.toLowerCase()}@example.com`,
      lop: 'CNTT-K65',
      dang_ky_hoc_phan_id: id,
    };
  }

  function dongDiem(
    id: number,
    maSv: string,
    hoTen: string,
    diem: Partial<DongDiem> = {},
  ): DongDiem {
    return {
      dang_ky_hoc_phan_id: id,
      sinh_vien: sinhVien(id, maSv, hoTen),
      diem_chuyen_can: null,
      diem_giua_ky: null,
      diem_cuoi_ky: null,
      diem_tong_ket: null,
      diem_chu: null,
      diem_he_4: null,
      ...diem,
    };
  }

  async function taoTrang(danhSach: DongDiem[]) {
    mockService = {
      layMot: () =>
        of({
          id: 7,
          ma_lop_hp: 'INT3306-01',
          mon_hoc: { ten_mon: 'Lập trình web' },
          hoc_ky: { ten_hoc_ky: 'Học kỳ 1', trang_thai: 'ONGOING' },
          da_chot_diem: false,
        } as LopHocPhan),
      layDiem: () => of(danhSach),
      capNhatDiem: (_id: number, diem: DongDiem[]) => of(diem),
      chotDiem: () => of({ id: 7, da_chot_diem: true }),
    };

    await TestBed.configureTestingModule({
      imports: [LopHocPhanDiem],
      providers: [
        provideRouter([]),
        { provide: LopHocPhanService, useValue: mockService },
        { provide: DiemService, useValue: { layLichSu: () => of([]) } },
        { provide: AuthService, useValue: { nguoiDung: () => ({ vai_tro: 'GIANG_VIEN' }) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '7' },
              queryParamMap: { get: () => null },
              routeConfig: { path: 'lop-hoc-phan/:id/diem' },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LopHocPhanDiem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('tải được bảng điểm và mặc định hiện đủ', async () => {
    await taoTrang([
      dongDiem(1, 'SV000001', 'Nguyễn Văn An'),
      dongDiem(2, 'SV000002', 'Trần Thị B'),
    ]);

    expect(component.diem().length).toBe(2);
    expect(component.diemHienThi().length).toBe(2);
    expect(component.dangTai()).toBe(false);
  });

  it('lọc theo họ tên gõ không dấu vẫn khớp', async () => {
    await taoTrang([
      dongDiem(1, 'SV000001', 'Nguyễn Văn An'),
      dongDiem(2, 'SV000002', 'Đặng Thị Đào'),
    ]);

    component.tuKhoa.set('nguyen');
    expect(component.diemHienThi().length).toBe(1);
    expect(component.diemHienThi()[0].sinh_vien.ho_ten).toBe('Nguyễn Văn An');

    component.tuKhoa.set('dang');
    expect(component.diemHienThi().length).toBe(1);
    expect(component.diemHienThi()[0].sinh_vien.ho_ten).toBe('Đặng Thị Đào');
  });

  it('lọc theo mã sinh viên', async () => {
    await taoTrang([
      dongDiem(1, 'SV000001', 'Nguyễn Văn An'),
      dongDiem(2, 'SV000002', 'Trần Thị B'),
    ]);

    component.tuKhoa.set('sv000002');
    expect(component.diemHienThi().length).toBe(1);
    expect(component.diemHienThi()[0].sinh_vien.ma_sv).toBe('SV000002');
  });

  it('không khớp ai thì danh sách hiển thị rỗng nhưng dữ liệu gốc còn nguyên', async () => {
    await taoTrang([dongDiem(1, 'SV000001', 'Nguyễn Văn An')]);

    component.tuKhoa.set('khong-co-ai-ten-nay');
    expect(component.diemHienThi().length).toBe(0);
    expect(component.diem().length).toBe(1);
  });

  it('đang lọc vẫn không được nới điều kiện chốt điểm — phải kiểm tra cả lớp', async () => {
    // Dòng 1 đủ 3 điểm thành phần, dòng 2 thì thiếu.
    await taoTrang([
      dongDiem(1, 'SV000001', 'Nguyễn Văn An', {
        diem_chuyen_can: 8,
        diem_giua_ky: 7,
        diem_cuoi_ky: 9,
      }),
      dongDiem(2, 'SV000002', 'Trần Thị B'),
    ]);

    // Lọc để chỉ thấy dòng đã đủ điểm.
    component.tuKhoa.set('Nguyễn');
    expect(component.diemHienThi().length).toBe(1);

    // Nếu đọc theo danh sách đang nhìn thấy thì sẽ cho chốt sai; đọc theo cả lớp thì đúng.
    expect(component.duDiem()).toBe(false);
  });

  it('lưu điểm gửi lên toàn bộ lớp chứ không chỉ dòng đang hiển thị', async () => {
    await taoTrang([
      dongDiem(1, 'SV000001', 'Nguyễn Văn An'),
      dongDiem(2, 'SV000002', 'Trần Thị B'),
    ]);

    const daGui: DongDiem[][] = [];
    mockService.capNhatDiem = (_id, diem) => {
      daGui.push(diem);
      return of(diem);
    };

    component.tuKhoa.set('Nguyễn');
    component.luu();

    expect(daGui.length).toBe(1);
    expect(daGui[0].length).toBe(2);
  });

  it('lớp chưa có sinh viên thì báo rỗng, không hiện ô tìm kiếm', async () => {
    await taoTrang([]);

    expect(component.diem().length).toBe(0);
    const than = fixture.nativeElement as HTMLElement;
    expect(than.querySelector('app-search-input')).toBeNull();
    expect(than.textContent).toContain('chưa có sinh viên đăng ký');
  });
});
