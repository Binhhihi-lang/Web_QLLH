import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuApi, MenuService } from '@core/services/menu.service';
import { Header } from './header';

describe('Header', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Header>>;
  let menuService: {
    layMenuHeader: ReturnType<typeof vi.fn>;
    phienBan: ReturnType<typeof signal<number>>;
  };

  beforeEach(() => {
    const menus: MenuApi[] = [
      {
        id: 1,
        ten: 'Giới thiệu',
        url: '/gioi-thieu',
        vi_tri: 'header',
        nhom: null,
        vai_tro: null,
        thu_tu: 1,
        trang_thai: true,
      },
      {
        id: 2,
        ten: 'Hướng dẫn',
        url: 'https://example.com/huong-dan',
        vi_tri: 'header',
        nhom: null,
        vai_tro: ['ADMIN'],
        thu_tu: 2,
        trang_thai: true,
      },
    ];
    menuService = {
      layMenuHeader: vi.fn(() => of(menus)),
      phienBan: signal(0),
    };
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: MenuService, useValue: menuService }],
    });
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  it('loads header links from the API and opens external links safely', () => {
    expect(menuService.layMenuHeader).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Giới thiệu');
    const external = fixture.nativeElement.querySelector(
      'a[href="https://example.com/huong-dan"]',
    );
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toContain('noopener');
  });

  it('reloads header links after a menu mutation', () => {
    menuService.layMenuHeader
      .mockReturnValueOnce(
        of([
          {
            id: 3,
            ten: 'Thông báo',
            url: '/thong-bao',
            vi_tri: 'header',
            nhom: null,
            vai_tro: null,
            thu_tu: 1,
            trang_thai: true,
          },
        ]),
      );
    menuService.phienBan.set(1);
    fixture.detectChanges();

    expect(menuService.layMenuHeader).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Thông báo');
  });
});
