import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChuongTrinhDaoTao, ChuongTrinhService } from '@core/services/chuong-trinh.service';
import { LopHocPhanService } from '@core/services/lop-hoc-phan.service';
import { ChuongTrinhChiTiet } from './chi-tiet';

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
  so_mon: 3,
  tong_tin_chi: 10,
  so_mon_chua_gan_ky: 1,
  sinh_vien_ap_dung: 126,
  mon: [
    {
      id: 11,
      ky_thu: 1,
      bat_buoc: true,
      mon_hoc: { id: 101, ma_mon: 'MATH101', ten_mon: 'Giải tích 1', so_tin_chi: 4 },
    },
    {
      id: 12,
      ky_thu: 1,
      bat_buoc: true,
      mon_hoc: { id: 102, ma_mon: 'MATH102', ten_mon: 'Đại số tuyến tính', so_tin_chi: 3 },
    },
    {
      id: 13,
      ky_thu: null,
      bat_buoc: false,
      mon_hoc: { id: 103, ma_mon: 'SE499', ten_mon: 'Chuyên đề tốt nghiệp', so_tin_chi: 3 },
    },
  ],
};

function taoComponent(danhSachMon = CTDT) {
  const service = {
    layMot: vi.fn(() => of(danhSachMon)),
    themMon: vi.fn(() => of(danhSachMon)),
    capNhatMon: vi.fn(() => of(danhSachMon)),
    xoaMon: vi.fn(() => of(undefined)),
    importCsv: vi.fn(() =>
      of({
        thanh_cong: 1,
        that_bai: 1,
        chi_tiet: [
          { ma_mon: 'MATH101', ket_qua: 'THANH_CONG' as const },
          { ma_mon: 'ENG101', ket_qua: 'THAT_BAI' as const, ma_loi: 'SUBJECT_NOT_FOUND' },
        ],
      }),
    ),
  };
  const lopHocPhan = { timMonHoc: vi.fn(() => of([])) };

  TestBed.configureTestingModule({
    imports: [ChuongTrinhChiTiet],
    providers: [
      { provide: ChuongTrinhService, useValue: service },
      { provide: LopHocPhanService, useValue: lopHocPhan },
    ],
  });

  const fixture = TestBed.createComponent(ChuongTrinhChiTiet);
  fixture.componentRef.setInput('id', String(danhSachMon.id));
  fixture.detectChanges();
  fixture.detectChanges();

  return { fixture, service, lopHocPhan };
}

describe('ChuongTrinhChiTiet', () => {
  it('groups subjects by term and merges the term cell with rowspan', () => {
    const { fixture } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.textContent).toContain('Kỹ thuật phần mềm — Khóa K67');
    expect(el.textContent).toContain('3 môn · 10 tín chỉ · 2 bắt buộc · 1 tự chọn · 126 sinh viên áp dụng');

    const oKy = el.querySelectorAll<HTMLTableCellElement>('td.cot-ky');
    expect([...oKy].map((o) => o.textContent?.trim())).toEqual(['Kỳ 1', 'Chưa gán']);
    // Hai môn cùng kỳ 1 gộp vào một ô Kỳ thứ.
    expect(oKy[0].getAttribute('rowspan')).toBe('2');
    expect(oKy[1].getAttribute('rowspan')).toBe('1');
  });

  it('warns about subjects without a term because students cannot register them', () => {
    const { fixture } = taoComponent();
    expect(fixture.nativeElement.textContent).toContain('1 môn chưa gán kỳ thứ.');
  });

  it('opens the row action menu and flips the subject type in one call', () => {
    const { fixture, service } = taoComponent();
    const el: HTMLElement = fixture.nativeElement;

    el.querySelector<HTMLButtonElement>('.nut-thao-tac')!.click();
    fixture.detectChanges();

    const muc = [...el.querySelectorAll<HTMLButtonElement>('.menu-noi button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(muc).toEqual(['Gán kỳ thứ', 'Đổi loại', 'Xóa khỏi chương trình']);

    el.querySelectorAll<HTMLButtonElement>('.menu-noi button')[1].click();
    expect(service.capNhatMon).toHaveBeenCalledWith(CTDT.id, 11, { ky_thu: 1, bat_buoc: false });
  });

  it('shows the empty state when the curriculum has no subject yet', () => {
    const { fixture } = taoComponent({
      ...CTDT,
      so_mon: 0,
      tong_tin_chi: 0,
      so_mon_chua_gan_ky: 0,
      mon: [],
    });

    expect(fixture.nativeElement.textContent).toContain('Chương trình chưa có môn');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });
});
