import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LichThi, LichThiInput, LichThiService } from '@core/services/lich-thi.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { LichThiTrang } from './danh-sach';

describe('LichThiTrang — chi tiết, sửa, xóa, trùng lịch', () => {
  let fixture: ComponentFixture<LichThiTrang>;
  let component: LichThiTrang;
  let service: {
    layDanhSach: ReturnType<typeof vi.fn>;
    tao: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
    xoa: ReturnType<typeof vi.fn>;
  };

  const caThi: LichThi = {
    id: 11,
    hoc_ky_id: 3,
    mon_hoc_id: 5,
    mon_hoc: { id: 5, ma_mon: 'INT3306', ten_mon: 'Phát triển ứng dụng Web' },
    ngay_thi: '2026-11-20',
    tiet_bat_dau: 1,
    tiet_ket_thuc: 3,
    gio_bat_dau: '07:30',
    gio_ket_thuc: '09:10',
    phong_hoc: { id: 2, ma_phong: 'A101', ten_phong: 'Phòng A101' },
    dot_thi: 'Giữa kỳ',
    ghi_chu: 'Sinh viên mang máy tính',
  };

  async function taoTrang(vaiTro = 'ADMIN', rows: LichThi[] = [caThi]) {
    service = {
      layDanhSach: vi.fn(() => of(rows)),
      tao: vi.fn((duLieu: LichThiInput) => of({ ...caThi, ...duLieu, id: 12 })),
      capNhat: vi.fn((id: number, duLieu: Partial<LichThiInput>) => of({ ...caThi, ...duLieu, id })),
      xoa: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [LichThiTrang],
      providers: [
        { provide: LichThiService, useValue: service },
        { provide: AuthService, useValue: { nguoiDung: signal({ vai_tro: vaiTro }) } },
        {
          provide: LopHocPhanService,
          useValue: {
            layTuyChon: (loai: string) =>
              of(
                loai === 'semesters'
                  ? [{ id: 3, label: 'HK1 2026-2027', trang_thai: 'ONGOING' }]
                  : [{ id: 2, label: 'A101' }],
              ),
            layTiet: () => of([{ id: 1, so_tiet: 1, label: 'Tiết 1' }]),
            timMonHoc: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LichThiTrang);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const than = () => fixture.nativeElement as HTMLElement;

  afterEach(() => vi.restoreAllMocks());

  it('bấm một dòng mở ngăn kéo chi tiết và Escape đóng được', async () => {
    await taoTrang();

    (than().querySelector('tbody tr.dong-thi') as HTMLElement).click();
    fixture.detectChanges();

    expect(component.dangXem()).toEqual(caThi);
    const noiDung = than().textContent ?? '';
    expect(noiDung).toContain('Chi tiết ca thi');
    expect(noiDung).toContain('Phát triển ứng dụng Web');
    expect(noiDung).toContain('20/11/2026');
    expect(noiDung).toContain('Sinh viên mang máy tính');

    component.khiNhanEscape();
    fixture.detectChanges();
    expect(component.dangXem()).toBeNull();
  });

  it('nút Sửa điền sẵn form và gọi capNhat chứ không tạo mới', async () => {
    await taoTrang();

    component.moSua(caThi);
    fixture.detectChanges();
    expect(component.form().id).toBe(11);
    expect(component.form().ghi_chu).toBe('Sinh viên mang máy tính');
    expect(than().textContent).toContain('Sửa ca thi');

    component.datGhiChu('Phòng đổi sang B202');
    component.luu();

    expect(service.tao).not.toHaveBeenCalled();
    expect(service.capNhat).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ ghi_chu: 'Phòng đổi sang B202', ngay_thi: '2026-11-20' }),
    );
  });

  it('Xóa phải qua hộp thoại xác nhận', async () => {
    await taoTrang();

    component.hoiXoa(caThi);
    fixture.detectChanges();
    expect(service.xoa).not.toHaveBeenCalled();
    expect(than().querySelector('app-confirm-dialog')).toBeTruthy();

    component.xacNhanXoa();
    expect(service.xoa).toHaveBeenCalledWith(11);
  });

  it('409 SCHEDULE_CONFLICT khi tạo ca thi hiện danh sách xung đột', async () => {
    await taoTrang();
    service.tao.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              success: false,
              ma_loi: 'SCHEDULE_CONFLICT',
              message: 'Ca thi trùng lịch của 12 sinh viên.',
              errors: {
                trung_lich: [
                  {
                    sinh_vien_id: 2,
                    ma_sv: 'SV002',
                    ho_ten: 'Nguyễn Văn A',
                    ma_lop_hp: 'INT3306-01',
                    ngay: '2026-11-20',
                    gio_bat_dau: '07:30',
                    gio_ket_thuc: '09:10',
                    loai: 'buoi_hoc',
                  },
                ],
                tong_so_vi_pham: 12,
              },
            },
          }),
      ),
    );

    component.moForm();
    component.datMonHoc(5);
    component.datNgayThi('2026-11-20');
    component.luu();
    fixture.detectChanges();

    expect(component.xungDotForm()?.dong).toHaveLength(1);
    const text = than().textContent ?? '';
    expect(text).toContain('Trùng lịch');
    expect(text).toContain('SV002');
    expect(text).toContain('INT3306-01');
    expect(text).toContain('và 11 vi phạm khác');
    // Form còn mở để người dùng sửa giờ/phòng.
    expect(component.dangMoForm()).toBe(true);
  });

  it('xung đột phòng hiện gọn: mã phòng, không cần sinh viên', async () => {
    await taoTrang();
    service.tao.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              success: false,
              ma_loi: 'SCHEDULE_CONFLICT',
              message: 'Trùng phòng thi.',
              errors: {
                trung_lich: [
                  { ngay_hoc: '2026-11-20', gio_bat_dau: '07:30', gio_ket_thuc: '09:10', loai: 'phong_hoc', doi_tuong: 'A101' },
                ],
              },
            },
          }),
      ),
    );

    component.moForm();
    component.datMonHoc(5);
    component.datNgayThi('2026-11-20');
    component.luu();
    fixture.detectChanges();

    expect(than().textContent).toContain('Phòng A101');
  });
});
