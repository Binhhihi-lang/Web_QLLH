import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ChuongTrinhDaoTao, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { KhoaNganhService } from '@core/services/khoa-nganh.service';
import { ChuongTrinhDanhSach } from './danh-sach';

const CTDT: ChuongTrinhDaoTao = {
  id: 3,
  ma_ctdt: 'CT-KTPM-K67',
  nganh: {
    id: 4,
    ma_nganh: 'KTPM',
    ten_nganh: 'Kỹ thuật phần mềm',
    khoa: { id: 1, ma_khoa: 'CNTT', ten_khoa: 'Công nghệ thông tin' },
  },
  khoa_hoc: 'K67',
  ten: 'Kỹ thuật phần mềm — Khóa K67',
  mo_ta: null,
  trang_thai: true,
  so_mon: 48,
  tong_tin_chi: 132,
  so_mon_chua_gan_ky: 0,
  sinh_vien_ap_dung: 126,
};

const TRANG = {
  data: [CTDT],
  meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
  links: { first: null, prev: null, next: null, last: null },
  success: true,
  message: 'OK',
};

function taoComponent() {
  const service = {
    layDanhSach: vi.fn(() => of(TRANG)),
    xoa: vi.fn(() => of(undefined)),
    tao: vi.fn(() => of(CTDT)),
    capNhat: vi.fn(() => of(CTDT)),
  };
  const khoaNganh = {
    layTuyChonNganh: vi.fn(() => of([{ id: 4, label: 'KTPM — Kỹ thuật phần mềm', ma_nganh: 'KTPM', khoa_id: 1 }])),
  };

  TestBed.configureTestingModule({
    imports: [ChuongTrinhDanhSach],
    providers: [
      provideRouter([]),
      { provide: ChuongTrinhService, useValue: service },
      { provide: KhoaNganhService, useValue: khoaNganh },
    ],
  });

  const fixture = TestBed.createComponent(ChuongTrinhDanhSach);
  fixture.detectChanges();
  fixture.detectChanges();

  return { fixture, service };
}

describe('ChuongTrinhDanhSach', () => {
  it('renders the summary columns of a curriculum', () => {
    const { fixture } = taoComponent();
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('CT-KTPM-K67');
    expect(text).toContain('KTPM');
    expect(text).toContain('Công nghệ thông tin');
    expect(text).toContain('48');
    expect(text).toContain('Đang áp dụng');
  });

  it('sends the chosen filters only after pressing Áp dụng', () => {
    const { fixture, service } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    const nganh = el.querySelector<HTMLSelectElement>('#loc-nganh')!;
    nganh.value = '4';
    nganh.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Chưa bấm Áp dụng thì chưa có request mới.
    expect(service.layDanhSach).toHaveBeenCalledTimes(2);

    const apDung = [...el.querySelectorAll<HTMLButtonElement>('app-button button')].find((b) =>
      b.textContent?.includes('Áp dụng'),
    )!;
    apDung.click();

    expect(service.layDanhSach).toHaveBeenLastCalledWith(
      expect.objectContaining({ nganh_id: 4, page: 1 }),
    );
  });

  it('deletes a curriculum from the row action menu after confirming', () => {
    const { fixture, service } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    el.querySelector<HTMLButtonElement>('.nut-thao-tac')!.click();
    fixture.detectChanges();

    const xoa = [...el.querySelectorAll<HTMLButtonElement>('.menu-noi button')].find((b) =>
      b.textContent?.includes('Xóa'),
    )!;
    xoa.click();
    fixture.detectChanges();

    const xacNhan = [...el.querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')].find(
      (b) => b.textContent?.trim() === 'Xoá',
    )!;
    xacNhan.click();

    expect(service.xoa).toHaveBeenCalledWith(CTDT.id);
  });
});
