import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LopHocPhan } from '@core/models/dao-tao.model';
import { ChuongTrinhDaoTao, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { LichHocService } from '@core/services/lich-hoc.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { DangKyService } from '@features/hoc-vu/dang-ky/dang-ky.service';
import { DiemService } from '@features/hoc-vu/diem/diem.service';
import { DangKyHocPhanSinhVien } from './dang-ky-hoc-phan';

const HOC_KY = [
  ...Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    label: `Học kỳ ${i + 1}`,
    trang_thai: 'CLOSED',
  })),
  { id: 7, label: 'Học kỳ 1 2026-2027', trang_thai: 'UPCOMING' },
];

const CTDT: ChuongTrinhDaoTao = {
  id: 3,
  ma_ctdt: 'CT-KTPM-K68',
  nganh: {
    id: 4,
    ma_nganh: 'KTPM',
    ten_nganh: 'Kỹ thuật phần mềm',
    khoa: { id: 1, ma_khoa: 'CNTT', ten_khoa: 'Công nghệ thông tin' },
  },
  khoa_hoc: 'K68',
  ten: 'Kỹ thuật phần mềm — Khóa K68',
  mo_ta: null,
  trang_thai: true,
  so_mon: 3,
  tong_tin_chi: 7,
  so_mon_chua_gan_ky: 0,
  sinh_vien_ap_dung: 131,
  mon: [
    {
      id: 71,
      ky_thu: 7,
      bat_buoc: true,
      mon_hoc: { id: 101, ma_mon: '396602', ten_mon: 'Giải tích 2', so_tin_chi: 2 },
    },
    {
      id: 61,
      ky_thu: 6,
      bat_buoc: true,
      mon_hoc: { id: 102, ma_mon: '250102', ten_mon: 'Vật lý 2', so_tin_chi: 2 },
    },
    {
      id: 51,
      ky_thu: 5,
      bat_buoc: false,
      mon_hoc: { id: 103, ma_mon: 'SE300', ten_mon: 'Kỹ thuật phần mềm nhập môn', so_tin_chi: 3 },
    },
  ],
};

const LOP: LopHocPhan = {
  id: 9,
  ma_lop_hp: '68PM2-396602',
  mon_hoc: { id: 101, ma_mon: '396602', ten_mon: 'Giải tích 2', so_tin_chi: 2 },
  hoc_ky: {
    id: 7,
    ma_hoc_ky: '2026-1',
    ten_hoc_ky: 'Học kỳ 1 2026-2027',
    nam_hoc: '2026-2027',
    ky_thu: 1,
    trang_thai: 'UPCOMING',
  },
  giang_vien: { id: 4, ma_gv: 'GV0004', ho_ten: 'TS. Trần Minh' },
  si_so_toi_da: 50,
  si_so_hien_tai: 42,
  trang_thai: 'OPEN',
  da_chot_diem: false,
  chot_diem_luc: null,
  da_xoa: false,
};

const BANG_DIEM = {
  hoc_ky: { id: 1, ma_hoc_ky: '2025-1', ten_hoc_ky: 'Học kỳ 1' },
  mon_hoc: [
    {
      ma_mon: 'SE300',
      ten_mon: 'Kỹ thuật phần mềm nhập môn',
      so_tin_chi: 3,
      diem_chuyen_can: null,
      diem_giua_ky: null,
      diem_cuoi_ky: null,
      diem_tong_ket: 3.2,
      diem_chu: 'F',
      diem_he_4: 0,
      ket_qua: 'KHONG_DAT' as const,
    },
    {
      ma_mon: '396602',
      ten_mon: 'Giải tích 2',
      so_tin_chi: 2,
      diem_chuyen_can: null,
      diem_giua_ky: null,
      diem_cuoi_ky: null,
      diem_tong_ket: 7.5,
      diem_chu: 'B',
      diem_he_4: 3,
      ket_qua: 'DAT' as const,
    },
  ],
  gpa_he_10: 7.5,
  gpa_he_4: 3,
  tong_tin_chi: 5,
};

function taoComponent() {
  const lopHocPhan = {
    layTuyChon: vi.fn(() => of(HOC_KY)),
    layDanhSach: vi.fn(() =>
      of({
        data: [LOP],
        meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
        links: { first: null, prev: null, next: null, last: null },
        success: true,
        message: 'OK',
      }),
    ),
  };
  const dangKy = {
    layCuaToi: vi.fn(() =>
      of({
        data: [],
        meta: { current_page: 1, per_page: 100, total: 0, last_page: 1 },
        links: { first: null, prev: null, next: null, last: null },
        success: true,
        message: 'OK',
      }),
    ),
    dangKyCuaToi: vi.fn(() => of({})),
  };
  const chuongTrinh = { layCuaToi: vi.fn(() => of(CTDT)) };
  const lichHoc = { layTatCa: vi.fn(() => of([])) };
  const diem = { layDiemCuaToi: vi.fn(() => of(BANG_DIEM)) };
  const auth = { nguoiDung: () => null };

  TestBed.configureTestingModule({
    imports: [DangKyHocPhanSinhVien],
    providers: [
      { provide: LopHocPhanService, useValue: lopHocPhan },
      { provide: DangKyService, useValue: dangKy },
      { provide: ChuongTrinhService, useValue: chuongTrinh },
      { provide: LichHocService, useValue: lichHoc },
      { provide: DiemService, useValue: diem },
      { provide: AuthService, useValue: auth },
    ],
  });

  const fixture = TestBed.createComponent(DangKyHocPhanSinhVien);
  fixture.detectChanges();
  fixture.detectChanges();

  return { fixture, lopHocPhan, dangKy, diem };
}

describe('DangKyHocPhanSinhVien', () => {
  it('lists only the subjects of the current programme term, not every term', () => {
    const { fixture } = taoComponent();
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('Giải tích 2');
    expect(text).toContain('396602');
    expect(text).not.toContain('Vật lý 2');
    expect(text).toContain('Kỹ thuật phần mềm khóa K68');
    expect(text).toContain('học kỳ thứ 7');
  });

  it('opens the class panel of the clicked subject for the selected semester', () => {
    const { fixture, lopHocPhan } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    el.querySelector<HTMLTableRowElement>('tr.dong-chon')!.click();
    fixture.detectChanges();

    expect(lopHocPhan.layDanhSach).toHaveBeenCalledWith({
      hoc_ky_id: 7,
      mon_hoc_id: 101,
      per_page: 100,
    });
    expect(el.textContent).toContain('68PM2-396602');
    expect(el.textContent).toContain('TS. Trần Minh');
    expect(el.textContent).toContain('42/50');
  });

  it('enables registration for an open class in an upcoming semester and sends the request', () => {
    const { fixture, dangKy } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    el.querySelector<HTMLTableRowElement>('tr.dong-chon')!.click();
    fixture.detectChanges();

    const nut = [...el.querySelectorAll<HTMLButtonElement>('app-button button')].find((b) =>
      b.textContent?.includes('Đăng ký'),
    )!;
    expect(nut.disabled).toBe(false);

    nut.click();
    expect(dangKy.dangKyCuaToi).toHaveBeenCalledWith(LOP.id);
  });

  it('shows the retake tab from failed grades joined with the curriculum', () => {
    const { fixture, diem } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    const tabHocLai = [...el.querySelectorAll<HTMLButtonElement>('.thanh-tab button')].find((b) =>
      b.textContent?.includes('Học lại'),
    )!;
    tabHocLai.click();
    fixture.detectChanges();
    fixture.detectChanges();

    // Sáu học kỳ đã đóng → sáu lần đọc bảng điểm, mỗi lần một lần gọi.
    expect(diem.layDiemCuaToi).toHaveBeenCalledTimes(6);
    expect(el.textContent).toContain('Kỹ thuật phần mềm nhập môn');
    expect(el.textContent).not.toContain('Giải tích 2');
  });
});
