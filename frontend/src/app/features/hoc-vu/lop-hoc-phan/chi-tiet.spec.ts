import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { LopHocPhanChiTiet } from './chi-tiet';

describe('LopHocPhanChiTiet — tab theo vai trò', () => {
  let fixture: ComponentFixture<LopHocPhanChiTiet>;
  let component: LopHocPhanChiTiet;

  const lop: LopHocPhan = {
    id: 7,
    ma_lop_hp: 'INT3306-2026-1-01',
    mon_hoc: { id: 1, ma_mon: 'INT3306', ten_mon: 'Lập trình web', so_tin_chi: 3 },
    hoc_ky: {
      id: 2,
      ma_hoc_ky: '2026-1',
      ten_hoc_ky: 'Học kỳ 1 năm học 2026-2027',
      nam_hoc: '2026-2027',
      ky_thu: 1,
      trang_thai: 'ONGOING',
    },
    giang_vien: { id: 4, ma_gv: 'GV0004', ho_ten: 'Nguyễn Minh An' },
    si_so_toi_da: 40,
    si_so_hien_tai: 25,
    nam_thu: null,
    trang_thai: 'OPEN',
    da_chot_diem: false,
    chot_diem_luc: null,
    da_xoa: false,
  };

  async function taoTrang(vaiTro: string) {
    await TestBed.configureTestingModule({
      imports: [LopHocPhanChiTiet],
      providers: [
        provideRouter([]),
        { provide: LopHocPhanService, useValue: { layMot: () => of(lop) } },
        { provide: AuthService, useValue: { nguoiDung: signal({ vai_tro: vaiTro }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '7' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LopHocPhanChiTiet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Toàn bộ href của thanh tab, đúng thứ tự hiển thị. */
  const hrefTab = (): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tabs a')).map(
      (a) => a.getAttribute('href') ?? '',
    );

  it('SINH_VIEN chỉ thấy 4 tab, không có tab quản lý của lớp', async () => {
    await taoTrang('SINH_VIEN');

    const href = hrefTab();
    expect(href).toEqual([
      '/lop-hoc-phan/7',
      '/lop-hoc-phan/7/sinh-vien',
      '/lop-hoc-phan/7/lich-hoc',
      '/diem-danh-cua-toi?hoc_ky_id=2',
      '/diem-cua-toi?hoc_ky_id=2',
    ]);

    // Không được có lối vào ba màn cả lớp: BE trả 403 cho sinh viên.
    expect(href.some((h) => h.endsWith('/diem'))).toBe(false);
    expect(href.some((h) => h.endsWith('/chuyen-can'))).toBe(false);
    expect(href.some((h) => h.startsWith('/diem-danh?'))).toBe(false);
  });

  it('SINH_VIEN có hai lối sang trang cá nhân, mang học kỳ của lớp', async () => {
    await taoTrang('SINH_VIEN');

    const href = hrefTab();
    expect(href).toContain('/diem-danh-cua-toi?hoc_ky_id=2');
    expect(href).toContain('/diem-cua-toi?hoc_ky_id=2');

    const nhan = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.tabs a'),
    ).map((a) => a.textContent?.trim());
    expect(nhan).toContain('Điểm danh của tôi');
    expect(nhan).toContain('Điểm của tôi');
  });

  it('GIANG_VIEN giữ đủ 6 tab quản lý lớp', async () => {
    await taoTrang('GIANG_VIEN');

    const href = hrefTab();
    expect(href.length).toBe(6);
    expect(href).toContain('/lop-hoc-phan/7/chuyen-can');
    expect(href).toContain('/lop-hoc-phan/7/diem');
    expect(href).toContain('/diem-danh?lop_hoc_phan_id=7');
    // Không lẫn lối sang trang cá nhân của sinh viên.
    expect(href.some((h) => h.startsWith('/diem-cua-toi'))).toBe(false);
    expect(href.some((h) => h.startsWith('/diem-danh-cua-toi'))).toBe(false);
  });

  it('ADMIN cũng thấy 6 tab và vẫn có nút Sửa lớp', async () => {
    await taoTrang('ADMIN');

    expect(hrefTab().length).toBe(6);
    // `app-button` render ra <button>, không phải <a>, nên kiểm bằng chữ.
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sửa lớp');
    expect(component.laAdmin()).toBe(true);
  });
});
