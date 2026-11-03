import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { KhoaNganhService } from './khoa-nganh.service';

describe('KhoaNganhService', () => {
  let service: KhoaNganhService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KhoaNganhService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads khoa with API filters and pagination', () => {
    service.layDanhSachKhoa({
      page: 2,
      per_page: 25,
      q: 'CNTT',
      trang_thai: true,
      sort_by: 'ten_khoa',
      sort_dir: 'asc',
    }).subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/khoa` &&
        req.params.get('page') === '2' &&
        req.params.get('per_page') === '25' &&
        req.params.get('q') === 'CNTT' &&
        req.params.get('trang_thai') === 'true' &&
        req.params.get('sort_by') === 'ten_khoa',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: {}, links: {}, success: true, message: 'OK' });
  });

  it('loads ngành filtered by khoa and unwraps the API response', () => {
    let result: unknown;
    service.layDanhSachNganh({ page: 1, per_page: 10, khoa_id: 3 }).subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/nganh` &&
        req.params.get('khoa_id') === '3',
    );
    request.flush({
      data: [{ id: 8, khoa_id: 3, ma_nganh: 'KTPM', ten_nganh: 'Kỹ thuật phần mềm' }],
      meta: {},
      links: {},
      success: true,
      message: 'OK',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ ma_nganh: 'KTPM' })],
    });
  });

  it('creates and updates khoa and ngành using the documented payloads', () => {
    const khoaInput = {
      ma_khoa: 'CNTT',
      ten_khoa: 'Công nghệ thông tin',
      mo_ta: null,
      trang_thai: true,
    };
    service.taoKhoa(khoaInput).subscribe();
    const createKhoa = http.expectOne(`${environment.apiBaseUrl}/khoa`);
    expect(createKhoa.request.method).toBe('POST');
    expect(createKhoa.request.body).toEqual(khoaInput);
    createKhoa.flush({ data: { id: 1, ...khoaInput, so_nganh: 0, da_xoa: false } });

    const nganhInput = {
      khoa_id: 1,
      ma_nganh: 'KTPM',
      ten_nganh: 'Công nghệ phần mềm',
      mo_ta: null,
      trang_thai: true,
    };
    service.capNhatNganh(4, nganhInput).subscribe();
    const updateNganh = http.expectOne(`${environment.apiBaseUrl}/nganh/4`);
    expect(updateNganh.request.method).toBe('PUT');
    expect(updateNganh.request.body).toEqual(nganhInput);
    updateNganh.flush({ data: { id: 4, khoa: null, da_xoa: false, ...nganhInput } });
  });

  it('surfaces delete failures and exposes active khoa options', () => {
    let optionResult: unknown;
    service.layTuyChonKhoa().subscribe((value) => {
      optionResult = value;
    });
    const options = http.expectOne(`${environment.apiBaseUrl}/options/khoa`);
    options.flush({ data: [{ id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' }] });
    expect(optionResult).toEqual([{ id: 1, label: 'Công nghệ thông tin', ma_khoa: 'CNTT' }]);

    let deleteError: unknown;
    service.xoaNganh(4).subscribe({ error: (error) => (deleteError = error) });
    const deletion = http.expectOne(`${environment.apiBaseUrl}/nganh/4`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(
      { ma_loi: 'DELETE_BLOCKED', message: 'Ngành còn lớp hành chính.' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(deleteError).toMatchObject({
      error: { ma_loi: 'DELETE_BLOCKED' },
      status: 409,
    });
  });
});
