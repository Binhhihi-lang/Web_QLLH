import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError, of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import {
  BuoiHoc,
  BuoiHocService,
  HinhThucHoc,
} from '@core/services/buoi-hoc.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { LopHocPhanLichHoc } from './lich-hoc';

describe('LopHocPhanLichHoc — hủy buổi, hình thức học, trùng lịch', () => {
  let fixture: ComponentFixture<LopHocPhanLichHoc>;
  let component: LopHocPhanLichHoc;
  let buoiHoc: {
    layCuaLop: ReturnType<typeof vi.fn>;
    themBuoi: ReturnType<typeof vi.fn>;
    doiTrangThai: ReturnType<typeof vi.fn>;
  };
  let danhSach: BuoiHoc[];

  function buoi(id: number, trangThai: BuoiHoc['trang_thai'], extra: Partial<BuoiHoc> = {}): BuoiHoc {
    return {
      id,
      lop_hoc_phan_id: 7,
      ngay_hoc: '2026-11-10',
      tiet_bat_dau: 1,
      tiet_ket_thuc: 3,
      gio_bat_dau: '07:30',
      gio_ket_thuc: '09:10',
      trang_thai: trangThai,
      ly_do_huy: null,
      buoi_goc_id: null,
      phong_hoc: { id: 2, ma_phong: 'A101', ten_phong: 'Phòng A101' },
      da_diem_danh: trangThai === 'DONE',
      so_diem_danh: trangThai === 'DONE' ? 3 : 0,
      ...extra,
    };
  }

  async function taoTrang(rows: BuoiHoc[], vaiTro = 'ADMIN') {
    danhSach = rows;
    buoiHoc = {
      layCuaLop: vi.fn(() => of(danhSach)),
      themBuoi: vi.fn(() => of(buoi(99, 'SCHEDULED'))),
      doiTrangThai: vi.fn(() => of(buoi(1, 'CANCELLED'))),
    };

    await TestBed.configureTestingModule({
      imports: [LopHocPhanLichHoc],
      providers: [
        { provide: BuoiHocService, useValue: buoiHoc },
        {
          provide: LopHocPhanService,
          useValue: {
            layTuyChon: () => of([{ id: 2, label: 'A101' }]),
            layTiet: () => of([{ id: 1, so_tiet: 1, label: 'Tiết 1' }]),
          },
        },
        { provide: AuthService, useValue: { nguoiDung: signal({ vai_tro: vaiTro }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LopHocPhanLichHoc);
    fixture.componentRef.setInput('lopId', 7);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const than = () => fixture.nativeElement as HTMLElement;

  it('ADMIN thấy nút Hủy cả ở buổi đã dạy; giảng viên thì không', async () => {
    await taoTrang([buoi(1, 'DONE'), buoi(2, 'SCHEDULED')], 'ADMIN');
    expect(than().querySelectorAll('.nut-huy').length).toBe(2);

    TestBed.resetTestingModule();
    await taoTrang([buoi(1, 'DONE'), buoi(2, 'SCHEDULED')], 'GIANG_VIEN');
    // Giảng viên chỉ còn nút Hủy của buổi chưa dạy.
    expect(than().querySelectorAll('.nut-huy').length).toBe(1);
  });

  it('bấm Hủy mở hộp thoại xác nhận chứ không hủy ngay', async () => {
    await taoTrang([buoi(2, 'SCHEDULED')]);

    (than().querySelector('.nut-huy') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(buoiHoc.doiTrangThai).not.toHaveBeenCalled();
    expect(than().querySelector('app-confirm-dialog')).toBeTruthy();
    expect(than().textContent).toContain('Hủy buổi học?');
  });

  it('hủy buổi đã dạy cảnh báo mất điểm danh và gửi xac_nhan=true', async () => {
    await taoTrang([buoi(1, 'DONE')]);

    component.hoiHuy(component.buoi()[0]);
    fixture.detectChanges();
    expect(than().textContent).toContain('Hủy sẽ xóa toàn bộ điểm danh');

    component.xacNhanHuy();
    expect(buoiHoc.doiTrangThai).toHaveBeenCalledWith(1, 'CANCELLED', { xac_nhan: true });
  });

  it('buổi chưa dạy cũng phải qua hộp thoại xác nhận', async () => {
    await taoTrang([buoi(2, 'SCHEDULED')]);

    component.hoiHuy(component.buoi()[0]);
    fixture.detectChanges();
    expect(component.dangHoiHuy()).not.toBeNull();
    expect(buoiHoc.doiTrangThai).not.toHaveBeenCalled();

    component.xacNhanHuy();
    expect(buoiHoc.doiTrangThai).toHaveBeenCalledWith(2, 'CANCELLED', { xac_nhan: false });
  });

  it('đóng hộp thoại bằng nút Hủy thì không gọi API', async () => {
    await taoTrang([buoi(2, 'SCHEDULED')]);

    component.hoiHuy(component.buoi()[0]);
    fixture.detectChanges();
    component.dongHoiHuy();
    fixture.detectChanges();

    expect(buoiHoc.doiTrangThai).not.toHaveBeenCalled();
    expect(than().querySelector('app-confirm-dialog')).toBeNull();
  });

  it('form thêm buổi gửi hinh_thuc và mặc định là lý thuyết', async () => {
    await taoTrang([]);
    component.moFormThem();
    fixture.detectChanges();
    expect(component.moi.hinh_thuc).toBe<HinhThucHoc>('LY_THUYET');

    component.moi.ngay_hoc = '2026-11-12';
    component.moi.hinh_thuc = 'THUC_HANH';
    component.them();

    expect(buoiHoc.themBuoi).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ ngay_hoc: '2026-11-12', hinh_thuc: 'THUC_HANH' }),
    );
  });

  it('409 trùng lịch hiện danh sách xung đột thay vì một câu chung', async () => {
    await taoTrang([]);
    buoiHoc.themBuoi.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              success: false,
              ma_loi: 'SCHEDULE_CONFLICT',
              message: 'Ca thi trùng lịch của 3 sinh viên.',
              errors: {
                trung_lich: [
                  {
                    ma_sv: 'SV002',
                    ho_ten: 'Nguyễn Văn A',
                    ma_lop_hp: 'INT3306-01',
                    ngay_hoc: '2026-11-03',
                    gio_bat_dau: '07:30',
                    gio_ket_thuc: '09:10',
                    loai: 'buoi_hoc',
                  },
                ],
                tong_so_vi_pham: 3,
              },
            },
          }),
      ),
    );

    component.moFormThem();
    component.moi.ngay_hoc = '2026-11-12';
    component.them();
    fixture.detectChanges();

    expect(component.xungDotThem()?.tongSo).toBe(3);
    expect(than().querySelector('app-xung-dot-lich')).toBeTruthy();
    expect(than().textContent).toContain('SV002');
    // 3 vi phạm, backend trả 1 dòng → phải nói còn 2.
    expect(than().textContent).toContain('và 2 vi phạm khác');
  });

  it('bảng hiện nhãn hình thức, buổi thiếu field thì coi là lý thuyết', async () => {
    await taoTrang([buoi(1, 'SCHEDULED', { hinh_thuc: 'TRUC_TUYEN' }), buoi(2, 'SCHEDULED')]);
    const text = than().textContent ?? '';
    expect(text).toContain('Trực tuyến');
    expect(text).toContain('Lý thuyết');
  });
});
