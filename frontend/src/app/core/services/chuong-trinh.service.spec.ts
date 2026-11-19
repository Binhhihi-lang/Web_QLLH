import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { ChuongTrinhService } from './chuong-trinh.service';

describe('ChuongTrinhService', () => {
  let service: ChuongTrinhService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChuongTrinhService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the curriculum list with every filter in the contract', () => {
    service
      .layDanhSach({
        page: 2,
        per_page: 25,
        q: 'KTPM',
        nganh_id: 4,
        khoa_hoc: 'K68',
        trang_thai: true,
        sort_by: 'ma_ctdt',
        sort_dir: 'desc',
      })
      .subscribe();

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/curriculums` &&
        req.params.get('page') === '2' &&
        req.params.get('per_page') === '25' &&
        req.params.get('q') === 'KTPM' &&
        req.params.get('nganh_id') === '4' &&
        req.params.get('khoa_hoc') === 'K68' &&
        req.params.get('trang_thai') === 'true' &&
        req.params.get('sort_by') === 'ma_ctdt' &&
        req.params.get('sort_dir') === 'desc',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: {}, links: {}, success: true, message: 'OK' });
  });

  it('creates, updates and deletes a curriculum with the documented payload', () => {
    const input = {
      ma_ctdt: 'CT-KTPM-K68',
      nganh_id: 4,
      khoa_hoc: 'K68',
      ten: 'Kỹ thuật phần mềm — Khóa K68',
      mo_ta: null,
      trang_thai: true,
    };

    service.tao(input).subscribe();
    const create = http.expectOne(`${environment.apiBaseUrl}/curriculums`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(input);
    create.flush({ data: { id: 7, ...input, so_mon: 0 } });

    service.capNhat(7, input).subscribe();
    const update = http.expectOne(`${environment.apiBaseUrl}/curriculums/7`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(input);
    update.flush({ data: { id: 7, ...input } });

    service.xoa(7).subscribe();
    const remove = http.expectOne(`${environment.apiBaseUrl}/curriculums/7`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ data: null });
  });

  it('adds a batch of subjects and updates or removes one row by its own id', () => {
    service.themMon(3, { mon_hoc_ids: [10, 11], ky_thu: 5, bat_buoc: false }).subscribe();
    const them = http.expectOne(`${environment.apiBaseUrl}/curriculums/3/subjects`);
    expect(them.request.method).toBe('POST');
    expect(them.request.body).toEqual({ mon_hoc_ids: [10, 11], ky_thu: 5, bat_buoc: false });
    them.flush({ data: { id: 3 } });

    // {mon} là id DÒNG chuong_trinh_mon, không phải id môn học.
    service.capNhatMon(3, 88, { ky_thu: null, bat_buoc: true }).subscribe();
    const sua = http.expectOne(`${environment.apiBaseUrl}/curriculums/3/subjects/88`);
    expect(sua.request.method).toBe('PUT');
    expect(sua.request.body).toEqual({ ky_thu: null, bat_buoc: true });
    sua.flush({ data: { id: 3 } });

    service.xoaMon(3, 88).subscribe();
    const xoa = http.expectOne(`${environment.apiBaseUrl}/curriculums/3/subjects/88`);
    expect(xoa.request.method).toBe('DELETE');
    xoa.flush({ data: null });
  });

  it('sends import rows and reads both the summary and the raw array shape', () => {
    const rows = [
      { ma_mon: 'MATH101', ky_thu: 1, bat_buoc: true },
      { ma_mon: 'ENG101', ky_thu: null, bat_buoc: undefined },
    ];

    let tongHop: unknown;
    service.importCsv(3, rows).subscribe((kq) => (tongHop = kq));
    const lan1 = http.expectOne(`${environment.apiBaseUrl}/curriculums/3/import`);
    expect(lan1.request.method).toBe('POST');
    expect(lan1.request.body).toEqual({ rows });
    lan1.flush({
      data: {
        thanh_cong: 1,
        that_bai: 1,
        chi_tiet: [
          { ma_mon: 'MATH101', ket_qua: 'THANH_CONG' },
          { ma_mon: 'ENG101', ket_qua: 'THAT_BAI', ma_loi: 'SUBJECT_NOT_FOUND' },
        ],
      },
    });
    expect(tongHop).toMatchObject({ thanh_cong: 1, that_bai: 1 });

    // Backend trả thẳng mảng dòng thô thì vẫn ra cùng một shape.
    let mang: unknown;
    service.importCsv(3, rows).subscribe((kq) => (mang = kq));
    const lan2 = http.expectOne(`${environment.apiBaseUrl}/curriculums/3/import`);
    lan2.flush({
      data: [
        { ma_mon: 'MATH101', ket_qua: 'THANH_CONG' },
        { ma_mon: 'ENG101', ket_qua: 'THANH_CONG' },
      ],
    });
    expect(mang).toEqual({
      thanh_cong: 2,
      that_bai: 0,
      chi_tiet: [
        { ma_mon: 'MATH101', ket_qua: 'THANH_CONG' },
        { ma_mon: 'ENG101', ket_qua: 'THANH_CONG' },
      ],
    });
  });

  it('reads the signed-in student curriculum and treats a 404 as "not assigned"', () => {
    let ketQua: unknown = 'chua-goi';
    service.layCuaToi().subscribe((ct) => (ketQua = ct));

    const request = http.expectOne(`${environment.apiBaseUrl}/me/curriculum`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: null }, { status: 200, statusText: 'OK' });
    expect(ketQua).toBeNull();

    service.layCuaToi().subscribe((ct) => (ketQua = ct));
    const khongCo = http.expectOne(`${environment.apiBaseUrl}/me/curriculum`);
    khongCo.flush(
      { success: false, message: 'Chưa được gán chương trình.', ma_loi: 'NOT_FOUND' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(ketQua).toBeNull();
  });
});
