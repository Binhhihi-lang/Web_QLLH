import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ThungRacService } from './thung-rac.service';

describe('ThungRacService', () => {
  let service: ThungRacService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ThungRacService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ThungRacService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gọi đúng endpoint danh sách thùng rác kèm params', () => {
    service
      .layDanhSach('subjects', {
        q: 'toan',
        deleted_by: 7,
        deleted_tu: '2026-10-01',
        deleted_den: '2026-10-31',
        page: 2,
        per_page: 25,
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/trash/subjects'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('toan');
    expect(req.request.params.get('deleted_by')).toBe('7');
    expect(req.request.params.get('deleted_tu')).toBe('2026-10-01');
    expect(req.request.params.get('deleted_den')).toBe('2026-10-31');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('25');
    req.flush({ success: true, message: 'OK', data: [], meta: { total: 0 } });
  });

  it('accepts all backend-supported system entity types', () => {
    service.layDanhSach('sessions').subscribe();
    const request = httpMock.expectOne((req) => req.url.endsWith('/trash/sessions'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, message: 'OK', data: [], meta: { total: 0 } });
  });

  it('gọi đúng endpoint khôi phục bản ghi', () => {
    service.khoiPhuc('subjects', 123).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/trash/subjects/123/restore'));
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'Khôi phục thành công.' });
  });
});
