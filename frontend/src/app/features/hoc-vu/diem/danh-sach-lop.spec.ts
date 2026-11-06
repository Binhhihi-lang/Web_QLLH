import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { DanhSachLopNhapDiem } from './danh-sach-lop';

describe('DanhSachLopNhapDiem', () => {
  const section: LopHocPhan = {
    id: 9,
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

  it('loads sections, filters them and links to the selected grade table', () => {
    const service = {
      layDanhSach: vi.fn(() =>
        of({
          data: [section],
          meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
          links: { first: null, prev: null, next: null, last: null },
          success: true,
          message: 'OK',
        }),
      ),
    };
    TestBed.configureTestingModule({
      imports: [DanhSachLopNhapDiem],
      providers: [provideRouter([]), { provide: LopHocPhanService, useValue: service }],
    });
    const fixture = TestBed.createComponent(DanhSachLopNhapDiem);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(section.ma_lop_hp);
    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe(
      `/lop-hoc-phan/${section.id}/diem`,
    );
    fixture.componentInstance.tuKhoa.set('khong-ton-tai');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Không tìm thấy lớp phù hợp');
  });

  it('loads the maximum supported page size for the class chooser', () => {
    const service = { layDanhSach: vi.fn(() => of({ data: [], meta: {}, links: {} })) };
    TestBed.configureTestingModule({
      imports: [DanhSachLopNhapDiem],
      providers: [provideRouter([]), { provide: LopHocPhanService, useValue: service }],
    });
    TestBed.createComponent(DanhSachLopNhapDiem).detectChanges();
    expect(service.layDanhSach).toHaveBeenCalledWith({ page: 1, per_page: 100 });
  });
});
