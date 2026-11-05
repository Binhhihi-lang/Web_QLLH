import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CauHinhService } from './cau-hinh.service';

describe('CauHinhService', () => {
  let service: CauHinhService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CauHinhService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CauHinhService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reads the settings belonging to the selected semester', () => {
    service.lay(12).subscribe((result) => {
      expect(result['diem.diem_danh.sua_trong_so_ngay']).toBe(7);
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/settings'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('hoc_ky_id')).toBe('12');
    request.flush({
      success: true,
      message: 'OK',
      data: { 'diem.diem_danh.sua_trong_so_ngay': 7 },
    });
  });

  it('loads the semester list with dates, status, and saved configuration state', () => {
    service.layHocKy().subscribe((result) => {
      expect(result[0].nam_hoc).toBe('2026-2027');
      expect(result[0].ngay_bat_dau).toBe('2026-09-01');
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/settings/semesters'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      message: 'OK',
      data: [
        {
          id: 12,
          label: 'Học kỳ 1 năm 2026-2027',
          ma_hoc_ky: '2026-1',
          nam_hoc: '2026-2027',
          ky_thu: 1,
          ngay_bat_dau: '2026-09-01',
          ngay_ket_thuc: '2027-01-15',
          mo_dang_ky_luc: '2026-08-01 08:00:00',
          dong_dang_ky_luc: '2026-08-15 17:00:00',
          trang_thai: 'UPCOMING',
          cau_hinh_da_luu: false,
        },
      ],
    });
  });

  it('saves settings directly for the selected semester', () => {
    const settings = {
      'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
      'diem.bang_quy_doi': [],
      'diem.diem_danh.sua_trong_so_ngay': 7,
    };
    service.capNhat(settings, 12).subscribe((result) => {
      expect(result['diem.diem_danh.sua_trong_so_ngay']).toBe(7);
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/settings'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      ...settings,
      hoc_ky_id: 12,
    });
    request.flush({ success: true, message: 'OK', data: settings });
  });
});
