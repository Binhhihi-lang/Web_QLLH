import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MenuService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads active sidebar menu entries from the API envelope', async () => {
    const result = firstValueFrom(service.layMenuSidebar());
    const request = http.expectOne(`${environment.apiBaseUrl}/menus?vi_tri=sidebar`);
    expect(request.request.method).toBe('GET');
    request.flush({
      success: true,
      message: 'Thành công',
      data: [
        {
          id: 1,
          ten: 'Lớp học phần',
          url: '/lop-hoc-phan',
          vi_tri: 'sidebar',
          nhom: 'Học vụ',
          vai_tro: null,
          thu_tu: 10,
          trang_thai: true,
        },
      ],
    });

    await expect(result).resolves.toEqual([
      expect.objectContaining({ ten: 'Lớp học phần', url: '/lop-hoc-phan' }),
    ]);
  });

  it('loads header entries separately from sidebar entries', async () => {
    const result = firstValueFrom(service.layMenuHeader());
    const request = http.expectOne(`${environment.apiBaseUrl}/menus?vi_tri=header`);
    request.flush({ data: [] });

    await expect(result).resolves.toEqual([]);
  });

  it('loads every non-deleted menu in admin management mode', async () => {
    const result = firstValueFrom(service.layDanhSach());
    const request = http.expectOne(`${environment.apiBaseUrl}/menus?quan_ly=1`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: [] });

    await expect(result).resolves.toEqual([]);
  });

  it('loads a single menu by id for the detail page', async () => {
    const result = firstValueFrom(service.layMot(14));
    const request = http.expectOne(`${environment.apiBaseUrl}/menus/14`);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        id: 14,
        ten: 'Menu',
        url: '/menu',
        vi_tri: 'sidebar',
        nhom: 'Hệ thống',
        vai_tro: ['ADMIN'],
        thu_tu: 31,
        trang_thai: true,
      },
    });

    await expect(result).resolves.toMatchObject({ id: 14, url: '/menu' });
  });

  it('creates, updates, and removes menu entries through the admin endpoints', async () => {
    const payload = {
      ten: 'Thống kê',
      url: '/thong-ke',
      vi_tri: 'sidebar' as const,
      nhom: 'Hệ thống',
      vai_tro: ['ADMIN' as const],
      thu_tu: 35,
      trang_thai: true,
    };
    const createdPromise = firstValueFrom(service.tao(payload));
    const createRequest = http.expectOne(`${environment.apiBaseUrl}/menus`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush({ data: { id: 20, ...payload } });
    const created = await createdPromise;

    const updatePayload = { ...payload, ten: 'Báo cáo' };
    const updatedPromise = firstValueFrom(service.capNhat(created.id, updatePayload));
    const updateRequest = http.expectOne(`${environment.apiBaseUrl}/menus/20`);
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(updatePayload);
    updateRequest.flush({ data: { id: 20, ...updatePayload } });
    await expect(updatedPromise).resolves.toMatchObject({ ten: 'Báo cáo' });

    const deletePromise = firstValueFrom(service.xoa(created.id));
    const deleteRequest = http.expectOne(`${environment.apiBaseUrl}/menus/20`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ data: null });
    await expect(deletePromise).resolves.toBeUndefined();
    expect(service.phienBan()).toBe(3);
  });
});
