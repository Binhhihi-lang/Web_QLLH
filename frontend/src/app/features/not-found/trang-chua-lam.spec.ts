import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MenuApi, MenuService } from '@core/services/menu.service';
import { TrangChuaLam } from './trang-chua-lam';

describe('TrangChuaLam', () => {
  const menus: MenuApi[] = [
    {
      id: 1,
      ten: 'Báo cáo thống kê',
      url: '/bao-cao-thong-ke',
      vi_tri: 'sidebar',
      nhom: 'Hệ thống',
      vai_tro: ['ADMIN'],
      thu_tu: 36,
      trang_thai: true,
    },
  ];

  function taoFixture(segments: string[], layMenuHienThi = vi.fn(() => of(menus))) {
    TestBed.configureTestingModule({
      imports: [TrangChuaLam],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { url: segments.map((path) => ({ path })) } },
        },
        { provide: MenuService, useValue: { layMenuHienThi } },
      ],
    });
    const fixture = TestBed.createComponent(TrangChuaLam);
    fixture.detectChanges();
    return { fixture, layMenuHienThi };
  }

  it('names the menu entry the user clicked', () => {
    const { fixture } = taoFixture(['bao-cao-thong-ke']);

    expect(fixture.nativeElement.textContent).toContain('Màn hình Báo cáo thống kê chưa làm');
    expect(fixture.nativeElement.textContent).toContain(
      'Nội dung trang báo cáo thống kê đang được chuẩn bị.',
    );
  });

  it('matches a nested path against the menu URL', () => {
    const { fixture } = taoFixture(['bao-cao', 'thong-ke'], vi.fn(() =>
      of([{ ...menus[0], url: '/bao-cao/thong-ke' }]),
    ));

    expect(fixture.nativeElement.textContent).toContain('Màn hình Báo cáo thống kê chưa làm');
  });

  it('falls back to a generic title when the menu list cannot be loaded', () => {
    const { fixture } = taoFixture(['bao-cao-thong-ke'], vi.fn(() => of([])));

    expect(fixture.nativeElement.textContent).toContain('Màn hình Đang xây dựng chưa làm');
  });
});
