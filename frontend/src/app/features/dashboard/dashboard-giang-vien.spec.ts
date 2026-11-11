import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { DashboardGiangVien } from './dashboard.model';
import { DashboardGiangVienPage } from './dashboard-giang-vien';

/**
 * SCR-04 — kiểm phần khác SCR-05: `con_sua_duoc = false` KHÔNG mở form điểm
 * danh, biểu đồ cột điểm TB lớp chỉ có MỘT chuỗi (không đường TB), và đổi kỳ
 * gửi đúng `hoc_ky_id`.
 */
describe('DashboardGiangVienPage', () => {
  const duLieu: DashboardGiangVien = {
    hoc_ky: {
      id: 2,
      ma_hoc_ky: '2026-1',
      ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027',
      trang_thai: 'ONGOING',
    },
    the_so_lieu: [
      {
        khoa: 'lop_phu_trach',
        label: 'Lớp phụ trách',
        gia_tri: 3,
        don_vi: null,
        phu_chu: '2 lớp chưa chốt điểm',
        xu_huong: 'bang',
      },
      {
        khoa: 'buoi_chua_diem_danh',
        label: 'Buổi chưa điểm danh',
        gia_tri: 2,
        don_vi: 'buổi',
        phu_chu: '1 buổi đã quá hạn sửa',
        xu_huong: 'bang',
      },
    ],
    lop_phu_trach: [
      {
        id: 61,
        ma_lop_hp: 'INT3306-2026-1-61',
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        so_tin_chi: 3,
        si_so: '38/45',
        ty_le: 84,
        nam_thu: 3,
        trang_thai: 'OPEN',
        da_chot_diem: false,
        diem_tb_lop: 7.9,
      },
      {
        id: 62,
        ma_lop_hp: 'INT2204-2026-1-62',
        ma_mon: 'INT2204',
        ten_mon: 'Cơ sở dữ liệu',
        so_tin_chi: 3,
        si_so: '41/45',
        ty_le: 91,
        nam_thu: 3,
        trang_thai: 'OPEN',
        da_chot_diem: false,
        diem_tb_lop: null,
      },
    ],
    buoi_sap_toi: [
      {
        id: 4102,
        ngay_hoc: '2026-11-09',
        thu: 2,
        tiet_bat_dau: 1,
        tiet_ket_thuc: 3,
        gio_bat_dau: '06:30',
        gio_ket_thuc: '09:10',
        hinh_thuc: 'THUC_HANH',
        trang_thai: 'SCHEDULED',
        ma_lop_hp: 'INT3306-2026-1-61',
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        phong_hoc: { id: 11, ma_phong: 'A101', ten_phong: 'Phòng A101' },
      },
    ],
    buoi_chua_diem_danh: [
      {
        id: 4088,
        ngay_hoc: '2026-10-29',
        thu: 5,
        tiet_bat_dau: 1,
        tiet_ket_thuc: 3,
        gio_ket_thuc: '09:10',
        ma_lop_hp: 'INT3306-2026-1-61',
        ma_mon: 'INT3306',
        ten_mon: 'Lập trình web',
        si_so_lop: 38,
        so_ngay_tre: 10,
        con_sua_duoc: false,
      },
    ],
    viec_can_lam: [
      {
        loai: 'cham_diem_danh',
        tieu_de: 'Điểm danh buổi đã qua',
        mo_ta: '2 buổi đã qua chưa điểm danh, trong đó 1 buổi đã quá hạn sửa.',
        so_luong: 2,
        muc_do: 'cao',
        url: '/diem-danh',
      },
    ],
  };

  function tao(layDashboard = vi.fn(() => of(duLieu))) {
    const router = { navigate: vi.fn(), navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      imports: [DashboardGiangVienPage],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { layDashboardGiangVien: layDashboard } },
        {
          provide: LopHocPhanService,
          useValue: {
            layTuyChon: vi.fn(() =>
              of([
                { id: 2, label: 'Học kỳ 1 năm học 2026-2027', trang_thai: 'ONGOING' },
                { id: 1, label: 'Học kỳ 2 năm học 2025-2026', trang_thai: 'CLOSED' },
              ]),
            ),
          },
        },
        { provide: AuthService, useValue: { nguoiDung: () => null, xoaPhien: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardGiangVienPage);
    fixture.detectChanges();
    return { fixture, layDashboard };
  }

  it('hiện tên kỳ, lớp phụ trách và việc cần làm', () => {
    const { fixture } = tao();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Học kỳ 1 năm học 2026-2027');
    expect(text).toContain('Lập trình web');
    expect(text).toContain('38/45');
    expect(text).toContain('Điểm danh buổi đã qua');
  });

  it('buổi sắp tới mang màu lý thuyết/thực hành theo hình thức', () => {
    const { fixture } = tao();
    const nhan = fixture.nativeElement.querySelector('.nhan-hinh-thuc') as HTMLElement;
    expect(nhan).toBeTruthy();
    expect(nhan.classList).toContain('loai-thuc-hanh');
    expect(nhan.textContent?.trim()).toBe('Thực hành');
  });

  it('buổi sắp tới là BẢNG 4 cột: Ngày, Tiết, Môn, Phòng', () => {
    const { fixture } = tao();
    const th = fixture.nativeElement.querySelectorAll(
      '.bang-buoi thead th',
    ) as NodeListOf<HTMLElement>;
    expect(Array.from(th).map((o) => o.textContent?.trim())).toEqual([
      'Ngày',
      'Tiết',
      'Môn',
      'Phòng',
    ]);

    const dong = fixture.nativeElement.querySelector('.bang-buoi tbody tr') as HTMLElement;
    const o = dong.querySelectorAll('td') as NodeListOf<HTMLElement>;
    expect(o).toHaveLength(4);
    // Ngày: thứ dạng ngắn + dd/mm/yyyy, không còn khối 66px riêng.
    expect(o[0].textContent?.trim()).toBe('T2 09/11/2026');
    expect(o[1].textContent?.trim()).toBe('1–3 · 06:30');
    expect(o[3].textContent?.trim()).toBe('A101');
  });

  it('dòng bảng dùng được bằng bàn phím: Enter/Space đi tới lịch học', () => {
    const { fixture } = tao();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const dong = fixture.nativeElement.querySelector('.bang-buoi tbody tr') as HTMLElement;
    expect(dong.getAttribute('tabindex')).toBe('0');

    dong.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigate).toHaveBeenCalledWith(['/lich-hoc']);

    navigate.mockClear();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    dong.dispatchEvent(space);
    expect(navigate).toHaveBeenCalledWith(['/lich-hoc']);
    // Space cuộn trang theo mặc định — handler phải chặn.
    expect(space.defaultPrevented).toBe(true);
  });

  it('lớp OPEN chưa chốt điểm hiện badge "Đang mở"', () => {
    const { fixture } = tao();
    const nhan = fixture.nativeElement.querySelectorAll(
      '.lop-dau app-status-badge',
    ) as NodeListOf<HTMLElement>;
    expect(Array.from(nhan).map((o) => o.textContent?.trim())).toEqual([
      'Đang mở',
      'Đang mở',
    ]);
    expect((nhan[0].querySelector('.badge') as HTMLElement).classList).toContain('sac-success');
  });

  it('biểu đồ cột điểm TB lớp chỉ vẽ lớp CÓ điểm TB', () => {
    const { fixture } = tao();
    const cot = fixture.nativeElement.querySelectorAll(
      'app-bieu-do-cot-diem .nhom-cot',
    ) as NodeListOf<HTMLElement>;
    // Lớp 61 có diem_tb_lop=7.9, lớp 62 null → chỉ một cột.
    expect(cot.length).toBe(1);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Điểm TB lớp phụ trách');
    expect(text).toContain('7,9');
  });

  it('không vẽ đường TB (chỉ một chuỗi dữ liệu)', () => {
    const { fixture } = tao();
    expect(fixture.nativeElement.querySelector('.duong-tb')).toBeNull();
  });

  it('buổi quá hạn sửa hiện badge "Quá hạn"', () => {
    const { fixture } = tao();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Quá hạn');
  });

  it('đổi học kỳ gửi đúng hoc_ky_id', () => {
    const { fixture, layDashboard } = tao();
    expect(layDashboard).toHaveBeenCalledWith(undefined);

    fixture.componentInstance.chonKy(1);
    fixture.detectChanges();

    expect(layDashboard).toHaveBeenLastCalledWith(1);
  });

  it('thẻ bấm được giới hạn đúng hai khoá theo đặc tả', () => {
    const { fixture } = tao();
    const c = fixture.componentInstance;
    expect(c.theBamDuoc('lop_phu_trach')).toBe(true);
    expect(c.theBamDuoc('buoi_chua_diem_danh')).toBe(true);
    expect(c.theBamDuoc('sinh_vien_phu_trach')).toBe(false);
    expect(c.theBamDuoc('buoi_sap_toi')).toBe(false);
  });
});
