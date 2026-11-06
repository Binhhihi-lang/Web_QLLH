import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DiemDanhService } from './diem-danh.service';

describe('DiemDanhService', () => {
  let service: DiemDanhService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiemDanhService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the attendance endpoints from the API contract', () => {
    service.layBuoiTheoLop(12).subscribe();
    service.layDiemDanh(1201).subscribe();
    service.layThongKe(12).subscribe();

    http.expectOne((request) => request.url.endsWith('/sections/12/sessions')).flush({ data: [] });
    http
      .expectOne((request) => request.url.endsWith('/sessions/1201/attendance'))
      .flush({ data: [] });
    http
      .expectOne((request) => request.url.endsWith('/sections/12/attendance-summary'))
      .flush({ data: {} });
  });

  it('saves attendance in the required bulk request shape', () => {
    const diemDanh = [{ dang_ky_hoc_phan_id: 7, trang_thai: 'PRESENT' as const, ghi_chu: null }];
    service.luuDiemDanh(1201, diemDanh).subscribe();

    const request = http.expectOne((item) => item.url.endsWith('/sessions/1201/attendance'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ diem_danh: diemDanh });
    request.flush({ data: [] });
  });
});
