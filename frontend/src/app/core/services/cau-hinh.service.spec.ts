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

  it('reads settings from GET /settings', () => {
    service.lay().subscribe((result) => {
      expect(result['diem.diem_danh.sua_trong_so_ngay']).toBe(7);
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/settings'));
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      message: 'OK',
      data: { 'diem.diem_danh.sua_trong_so_ngay': 7 },
    });
  });

  it('saves settings as the backend key-value object', () => {
    const settings = {
      'diem.trong_so': { chuyen_can: 0.25, giua_ky: 0.25, cuoi_ky: 0.5 },
      'diem.bang_quy_doi': [],
      'diem.diem_danh.sua_trong_so_ngay': 7,
    };
    service.capNhat(settings).subscribe((result) => {
      expect(result['diem.diem_danh.sua_trong_so_ngay']).toBe(7);
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/settings'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(settings);
    request.flush({ success: true, message: 'OK', data: settings });
  });
});
