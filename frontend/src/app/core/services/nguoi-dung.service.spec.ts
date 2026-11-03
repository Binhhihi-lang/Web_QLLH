import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NguoiDungService } from './nguoi-dung.service';

describe('NguoiDungService', () => {
  let service: NguoiDungService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NguoiDungService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NguoiDungService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads users with search, role, status and pagination filters', () => {
    service
      .layDanhSach({
        page: 2,
        per_page: 25,
        q: 'admin',
        vai_tro: 'ADMIN',
        trang_thai: false,
        sort_by: 'email',
        sort_dir: 'desc',
      })
      .subscribe((response) => expect(response.data).toEqual([]));

    const request = httpMock.expectOne((req) => req.url.endsWith('/users'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('trang_thai')).toBe('false');
    expect(request.request.params.get('vai_tro')).toBe('ADMIN');
    expect(request.request.params.get('per_page')).toBe('25');
    request.flush({ success: true, message: 'OK', data: [], meta: {}, links: {} });
  });

  it('creates a user and exposes the one-time initial password', () => {
    const input = {
      name: 'Quản trị viên',
      email: 'admin2@example.edu.vn',
      vai_tro: 'ADMIN' as const,
      trang_thai: true,
    };
    service.taoMoi(input).subscribe((user) => {
      expect(user.name).toBe(input.name);
      expect(user.mat_khau_ban_dau).toBe('one-time-password');
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/users'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({
      success: true,
      message: 'Created',
      data: {
        id: 2,
        ...input,
        avatar_url: null,
        must_change_password: true,
        ho_so: null,
        mat_khau_ban_dau: 'one-time-password',
      },
    });
  });

  it('resets a user password using the dedicated action endpoint', () => {
    service.datLaiMatKhau(4).subscribe((user) => {
      expect(user.mat_khau_moi).toBe('new-one-time-password');
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/users/4/reset-password'));
    expect(request.request.method).toBe('POST');
    request.flush({
      success: true,
      message: 'Reset',
      data: { id: 4, mat_khau_moi: 'new-one-time-password' },
    });
  });

  it('updates a user using PUT /users/{id}', () => {
    const input = {
      name: 'Quản trị đã sửa',
      email: 'admin@example.edu.vn',
      vai_tro: 'ADMIN' as const,
      trang_thai: true,
    };
    service.capNhat(2, input).subscribe((user) => expect(user.name).toBe(input.name));

    const request = httpMock.expectOne((req) => req.url.endsWith('/users/2'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(input);
    request.flush({ success: true, message: 'Updated', data: { id: 2, ...input } });
  });

  it('updates a single account status through PATCH /users/{id}/status', () => {
    service.doiTrangThai(4, false).subscribe((user) => expect(user.trang_thai).toBe(false));

    const request = httpMock.expectOne((req) => req.url.endsWith('/users/4/status'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ trang_thai: false });
    request.flush({ success: true, message: 'Updated', data: { id: 4, trang_thai: false } });
  });

  it('deletes an account through DELETE /users/{id}', () => {
    service.xoa(6).subscribe();

    const request = httpMock.expectOne((req) => req.url.endsWith('/users/6'));
    expect(request.request.method).toBe('DELETE');
    request.flush({ success: true, message: 'Deleted', data: null });
  });

  it('sends bulk status updates through the bulk-status endpoint', () => {
    service.doiTrangThaiHangLoat([3, 5], false).subscribe((result) => {
      expect(result.thanh_cong).toBe(1);
      expect(result.that_bai).toBe(1);
    });

    const request = httpMock.expectOne((req) => req.url.endsWith('/users/bulk-status'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ ids: [3, 5], trang_thai: false });
    request.flush({
      success: true,
      message: 'Done',
      data: { thanh_cong: 1, that_bai: 1, chi_tiet: [] },
    });
  });
});
