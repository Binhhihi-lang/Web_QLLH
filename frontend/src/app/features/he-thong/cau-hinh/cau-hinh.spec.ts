import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CauHinhDiem } from '@core/models/he-thong.model';
import { CauHinhService, HocKyCauHinh } from '@core/services/cau-hinh.service';
import { AppToastService } from '@shared/ui/app-toast.service';
import { CauHinhPage } from './cau-hinh';

describe('CauHinhPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CauHinhPage>>;
  let service: {
    lay: ReturnType<typeof vi.fn>;
    layHocKy: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
  };
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let routeData: BehaviorSubject<Record<string, unknown>>;
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };
  const toast = { hien: vi.fn() };
  const config: CauHinhDiem = {
    'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
    'diem.bang_quy_doi': [
      { tu: 8.5, den: 10, chu: 'A', he_4: 4, xep_loai: 'Giỏi', dat: true },
      { tu: 8, den: 8.49, chu: 'B+', he_4: 3.5, xep_loai: 'Khá giỏi', dat: true },
      { tu: 7, den: 7.99, chu: 'B', he_4: 3, xep_loai: 'Khá', dat: true },
      { tu: 6.5, den: 6.99, chu: 'C+', he_4: 2.5, xep_loai: 'Trung bình khá', dat: true },
      { tu: 5.5, den: 6.49, chu: 'C', he_4: 2, xep_loai: 'Trung bình', dat: true },
      { tu: 5, den: 5.49, chu: 'D+', he_4: 1.5, xep_loai: 'Trung bình yếu', dat: true },
      { tu: 4, den: 4.99, chu: 'D', he_4: 1, xep_loai: 'Yếu', dat: true },
      { tu: 0, den: 3.99, chu: 'F', he_4: 0, xep_loai: 'Kém (không đạt)', dat: false },
    ],
    'diem.diem_danh.sua_trong_so_ngay': 7,
  };
  const apiConfig = {
    ...config,
    'diem.cau_hinh_hoc_ky': { id: 8, hoc_ky_id: 21, quy_tac_lam_tron: 'HALF_UP_2' as const },
  };
  const semesters: HocKyCauHinh[] = [
    {
      id: 21,
      label: 'Học kỳ 1 năm 2026-2027',
      ma_hoc_ky: '2026-1',
      nam_hoc: '2026-2027',
      ky_thu: 1,
      ngay_bat_dau: '2026-09-01',
      ngay_ket_thuc: '2027-01-15',
      mo_dang_ky_luc: '2026-08-01 08:00:00',
      dong_dang_ky_luc: '2026-08-15 17:00:00',
      trang_thai: 'UPCOMING',
      cau_hinh_da_luu: true,
    },
    {
      id: 22,
      label: 'Học kỳ 2 năm 2026-2027',
      ma_hoc_ky: '2026-2',
      nam_hoc: '2026-2027',
      ky_thu: 2,
      ngay_bat_dau: '2027-01-20',
      ngay_ket_thuc: '2027-05-30',
      mo_dang_ky_luc: '2027-01-01 08:00:00',
      dong_dang_ky_luc: '2027-01-15 17:00:00',
      trang_thai: 'ONGOING',
      cau_hinh_da_luu: true,
    },
  ];

  beforeEach(() => {
    toast.hien.mockClear();
    router.navigate.mockClear();
    routeParams = new BehaviorSubject(convertToParamMap({}));
    routeData = new BehaviorSubject<Record<string, unknown>>({});
    service = {
      lay: vi.fn(() => of(apiConfig)),
      layHocKy: vi.fn(() => of(semesters)),
      capNhat: vi.fn(() => of(apiConfig)),
    };
    TestBed.configureTestingModule({
      imports: [CauHinhPage],
      providers: [
        { provide: CauHinhService, useValue: service },
        { provide: AppToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParams.asObservable(),
            data: routeData.asObservable(),
            get snapshot() {
              return { paramMap: routeParams.value };
            },
          },
        },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(CauHinhPage);
    fixture.detectChanges();
  });

  function moTrangSua(hocKyId: number): void {
    routeData.next({ editMode: true });
    routeParams.next(convertToParamMap({ hocKyId: String(hocKyId) }));
    fixture.detectChanges();
  }

  it('keeps the semester list separate from its detail page', () => {
    expect(service.layHocKy).toHaveBeenCalledOnce();
    expect(service.lay).not.toHaveBeenCalled();
    const rows = fixture.nativeElement.querySelectorAll(
      'tbody tr.dong-hoc-ky',
    ) as NodeListOf<HTMLTableRowElement>;
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).not.toContain('Xem chi tiết');
    expect(fixture.nativeElement.querySelector('.form-cau-hinh')).toBeNull();
    rows[1].click();
    expect(router.navigate).toHaveBeenCalledWith(['/cau-hinh', 21]);
    expect(rows[1].querySelector('td:last-child app-button')).not.toBeNull();
  });

  it('loads and displays the selected semester configuration on its own route', () => {
    moTrangSua(21);
    expect(service.layHocKy).toHaveBeenCalledOnce();
    expect(service.lay).toHaveBeenCalledWith(21);
    expect(fixture.nativeElement.textContent).toContain('Sửa cấu hình điểm');
    expect(fixture.nativeElement.textContent).toContain('Trọng số điểm thành phần');
    expect(fixture.nativeElement.textContent).toContain('Thời hạn sửa điểm danh');
    expect(fixture.nativeElement.textContent).toContain('HALF_UP');
    expect(fixture.componentInstance.tongTrongSoHopLe()).toBe(true);
  });

  it('renders score-range actions and API grades on the edit route', () => {
    moTrangSua(21);
    const actions = fixture.nativeElement.querySelectorAll(
      'tbody td:last-child button.nut-hanh-dong',
    );
    const selects = fixture.nativeElement.querySelectorAll('tbody select[aria-label="Điểm chữ"]');
    expect(actions).toHaveLength(config['diem.bang_quy_doi'].length);
    expect(fixture.nativeElement.querySelectorAll('option[value="B+"]')).not.toHaveLength(0);
    expect(
      Array.from(selects as NodeListOf<HTMLSelectElement>).map((select) => select.value),
    ).toEqual(config['diem.bang_quy_doi'].map((range) => range.chu));
  });

  it('opens the detail route read-only and offers a separate edit action', () => {
    routeParams.next(convertToParamMap({ hocKyId: '21' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chi tiết cấu hình điểm');
    expect(fixture.nativeElement.querySelector('.danh-sach')).toBeNull();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sửa cấu hình');
  });

  it('filters semesters by text and status', () => {
    fixture.componentInstance.tuKhoa.set('2026-2');
    fixture.componentInstance.locTrangThai.set('ONGOING');
    expect(fixture.componentInstance.hocKyLoc().map((row) => row.id)).toEqual([22]);
  });

  it('clears every filter at once', () => {
    fixture.componentInstance.tuKhoa.set('2026-2');
    fixture.componentInstance.locNamHoc.set('2026-2027');
    fixture.componentInstance.locTrangThai.set('ONGOING');
    fixture.componentInstance.locCauHinh.set('saved');
    fixture.componentInstance.xoaLoc();
    expect(fixture.componentInstance.tuKhoa()).toBe('');
    expect(fixture.componentInstance.locNamHoc()).toBe('');
    expect(fixture.componentInstance.locTrangThai()).toBe('');
    expect(fixture.componentInstance.locCauHinh()).toBe('');
  });

  it('makes ongoing semester settings read-only', () => {
    moTrangSua(22);
    expect(fixture.componentInstance.choPhepSua()).toBe(false);
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeNull();
  });

  it('blocks saving weights that do not total one', () => {
    moTrangSua(21);
    fixture.componentInstance.doiTrongSo('cuoi_ky', {
      target: { value: '0.4' },
    } as unknown as Event);
    fixture.componentInstance.luu(new Event('submit'));
    expect(service.capNhat).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loiValidation()['diem.trong_so']).toBeTruthy();
  });

  it('saves and returns to the read-only detail page', () => {
    moTrangSua(21);
    fixture.componentInstance.luu(new Event('submit'));
    expect(service.capNhat).toHaveBeenCalledWith(config, 21);
    expect(toast.hien).toHaveBeenCalledWith(
      expect.stringContaining('Đã lưu cấu hình cho'),
      'success',
    );
    expect(fixture.componentInstance.cacHocKy().find((row) => row.id === 21)?.cau_hinh_da_luu).toBe(
      true,
    );
    expect(router.navigate).toHaveBeenLastCalledWith(['/cau-hinh', 21]);
  });
});
