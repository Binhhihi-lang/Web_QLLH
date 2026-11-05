import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LopHanhChinhService } from './lop-hanh-chinh.service';
import { LopHanhChinhChiTiet } from './chi-tiet';

describe('LopHanhChinhChiTiet', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<LopHanhChinhChiTiet>>;
  let service: {
    layMot: ReturnType<typeof vi.fn>;
    laySinhVien: ReturnType<typeof vi.fn>;
    timSinhVien: ReturnType<typeof vi.fn>;
    ganSinhVien: ReturnType<typeof vi.fn>;
    goSinhVien: ReturnType<typeof vi.fn>;
  };

  const lop = {
    id: 1,
    ma_lop: 'CNTT-K65-01',
    ten_lop: 'Công nghệ thông tin K65 - Lớp 01',
    khoa_hoc: 'K65',
    nganh_id: 1,
    nganh: 'Công nghệ phần mềm',
    nam_nhap_hoc: 2023,
    si_so: 42,
    trang_thai: true,
    da_xoa: false,
    mo_ta: null,
  };
  const response = {
    data: [
      {
        id: 1,
        ma_sv: '2000000',
        ho_ten: 'Nguyễn Văn An',
        ngay_sinh: null,
        gioi_tinh: true,
        email: 'an@example.edu.vn',
        so_dien_thoai: null,
        dia_chi: null,
        trang_thai: true,
        lop_hanh_chinh: { id: 1, ma_lop: 'CNTT-K65-01', ten_lop: 'CNTT-K65-01' },
        avatar_url: null,
        da_xoa: false,
      },
    ],
    meta: { current_page: 1, per_page: 25, total: 1, last_page: 1 },
    links: { first: null, prev: null, next: null, last: null },
    success: true,
    message: 'Thành công',
  };

  beforeEach(() => {
    service = {
      layMot: vi.fn(() => of(lop)),
      laySinhVien: vi.fn(() => of(response)),
      timSinhVien: vi.fn(() => of({ data: [], meta: response.meta, links: response.links })),
      ganSinhVien: vi.fn(() => of(undefined)),
      goSinhVien: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [LopHanhChinhChiTiet],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: LopHanhChinhService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(LopHanhChinhChiTiet);
    fixture.detectChanges();
  });

  it('loads the class roster with no filters and renders search and status controls', () => {
    expect(service.laySinhVien).toHaveBeenLastCalledWith(1, {
      page: 1,
      per_page: 25,
      sort_by: 'ho_ten',
      sort_dir: 'asc',
      q: undefined,
      trang_thai: undefined,
    });
    expect(fixture.nativeElement.textContent).toContain('2000000');
    expect(fixture.nativeElement.querySelector('app-search-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('select[aria-label="Lọc sinh viên theo trạng thái"]'))
      .not.toBeNull();
  });

  it('searches by keyword and resets pagination', () => {
    fixture.componentInstance.trangHienTai.set(3);

    fixture.componentInstance.doiTuKhoaDanhSach('  2000000  ');

    expect(service.laySinhVien).toHaveBeenLastCalledWith(1, {
      page: 1,
      per_page: 25,
      sort_by: 'ho_ten',
      sort_dir: 'asc',
      q: '2000000',
      trang_thai: undefined,
    });
  });

  it('filters by active state and combines the filter with the search keyword', () => {
    fixture.componentInstance.doiTuKhoaDanhSach('Nguyễn');
    fixture.componentInstance.doiLocTrangThaiDanhSach({
      target: { value: 'false' },
    } as unknown as Event);

    expect(service.laySinhVien).toHaveBeenLastCalledWith(1, {
      page: 1,
      per_page: 25,
      sort_by: 'ho_ten',
      sort_dir: 'asc',
      q: 'Nguyễn',
      trang_thai: false,
    });
  });

  it('clears both filters and distinguishes an empty filter result from an empty class', () => {
    fixture.componentInstance.doiTuKhoaDanhSach('missing');
    service.laySinhVien.mockReturnValue(
      of({ ...response, data: [], meta: { ...response.meta, total: 0 } }),
    );
    fixture.componentInstance.doiLocTrangThaiDanhSach({
      target: { value: 'false' },
    } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Không tìm thấy sinh viên phù hợp');

    fixture.componentInstance.xoaLocDanhSach();

    expect(service.laySinhVien).toHaveBeenLastCalledWith(1, {
      page: 1,
      per_page: 25,
      sort_by: 'ho_ten',
      sort_dir: 'asc',
      q: undefined,
      trang_thai: undefined,
    });
    expect(fixture.componentInstance.coLocRoster()).toBe(false);
  });
});
