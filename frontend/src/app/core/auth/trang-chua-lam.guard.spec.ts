import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/auth/auth.service';
import { laTrangChuaLamGuard } from './trang-chua-lam.guard';

describe('laTrangChuaLamGuard', () => {
  let http: HttpTestingController;

  function taoGuard(duongDan: string, coToken = true) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { layToken: () => (coToken ? 'token-gia' : null) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);

    return TestBed.runInInjectionContext(() =>
      laTrangChuaLamGuard(
        {} as never,
        duongDan.split('/').filter(Boolean).map((path) => ({ path })) as never,
        undefined as never,
      ),
    );
  }

  it('matches when the URL exists in the menu table', async () => {
    const ketQua = firstValueFrom(taoGuard('/bao-cao-thong-ke') as never);
    http.expectOne(`${environment.apiBaseUrl}/menus`).flush({
      data: [
        {
          id: 1,
          ten: 'Báo cáo thống kê',
          url: '/bao-cao-thong-ke',
          vi_tri: 'sidebar',
          nhom: 'Hệ thống',
          vai_tro: 'ADMIN',
          thu_tu: 36,
          trang_thai: true,
        },
      ],
    });

    await expect(ketQua).resolves.toBe(true);
  });

  it('does not match when no menu declares the URL, so the 404 route wins', async () => {
    const ketQua = firstValueFrom(taoGuard('/go-nham') as never);
    http.expectOne(`${environment.apiBaseUrl}/menus`).flush({ data: [] });

    await expect(ketQua).resolves.toBe(false);
  });

  it('lets the layout through before login so the auth guard can redirect', () => {
    expect(taoGuard('/gioi-thieu', false)).toBe(true);
  });
});
