import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MenuApi, MenuService } from '@core/services/menu.service';
import { routes } from '../../../app.routes';
import { MenuQuanLy } from './quan-ly';

describe('MenuQuanLy', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MenuQuanLy>>;
  let service: {
    layDanhSach: ReturnType<typeof vi.fn>;
    tao: ReturnType<typeof vi.fn>;
    capNhat: ReturnType<typeof vi.fn>;
    xoa: ReturnType<typeof vi.fn>;
  };

  const menus: MenuApi[] = [
    {
      id: 1,
      ten: 'Báo cáo',
      url: '/bao-cao',
      vi_tri: 'sidebar',
      nhom: 'Hệ thống',
      vai_tro: ['ADMIN'],
      thu_tu: 35,
      trang_thai: true,
    },
    {
      id: 2,
      ten: 'Menu cũ',
      url: '/menu-cu',
      vi_tri: 'header',
      nhom: null,
      vai_tro: null,
      thu_tu: 1,
      trang_thai: false,
    },
  ];

  beforeEach(() => {
    service = {
      layDanhSach: vi.fn(() => of(menus)),
      tao: vi.fn((menu) => of({ id: 3, ...menu })),
      capNhat: vi.fn((id, menu) => of({ id, ...menu })),
      xoa: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [MenuQuanLy],
      providers: [provideRouter(routes), { provide: MenuService, useValue: service }],
    });
    fixture = TestBed.createComponent(MenuQuanLy);
    fixture.detectChanges();
  });

  it('loads active and hidden menu entries from the admin list endpoint', () => {
    expect(service.layDanhSach).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Báo cáo');
    expect(fixture.nativeElement.textContent).toContain('Menu cũ');
    expect(fixture.nativeElement.textContent).toContain('Đang ẩn');
  });

  it('opens the menu detail page when its row is selected', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;

    row.click();

    expect(navigate).toHaveBeenCalledWith(['/menu', 1]);
  });

  it('opens the edit page from the edit button without opening the inline form', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const editButton = fixture.nativeElement.querySelector(
      'button[aria-label="Sửa menu Báo cáo"]',
    ) as HTMLButtonElement;

    editButton.click();

    expect(navigate).toHaveBeenCalledWith(['/menu', 1, 'sua']);
    expect(fixture.componentInstance.formMo()).toBe(false);
  });

  it('keeps visibility actions separate from opening the detail page', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const visibilityButton = fixture.nativeElement.querySelector(
      'button[aria-label="Ẩn menu Báo cáo"]',
    ) as HTMLButtonElement;

    visibilityButton.click();

    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ trang_thai: false }),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('updates visibility and reloads the list after a successful change', () => {
    fixture.componentInstance.doiTrangThai(menus[0]);

    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ trang_thai: false }),
    );
    expect(service.layDanhSach).toHaveBeenCalledTimes(2);
  });

  it('creates a menu using the submitted values and refreshes the list', () => {
    fixture.componentInstance.batDauTao();
    fixture.detectChanges();

    const ten = fixture.nativeElement.querySelector('input[name="ten"]') as HTMLInputElement;
    const url = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    ten.value = 'Báo cáo';
    ten.dispatchEvent(new Event('input'));
    url.value = '/bao-cao';
    url.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(service.tao).toHaveBeenCalledWith(
      expect.objectContaining({
        ten: 'Báo cáo',
        url: '/bao-cao',
        vi_tri: 'sidebar',
        trang_thai: true,
      }),
    );
    expect(service.layDanhSach).toHaveBeenCalledTimes(2);
  });

  it('saves a menu whose page does not exist yet but warns that it opens the placeholder page', () => {
    fixture.componentInstance.batDauTao();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('input[name="ten"]') as HTMLInputElement;
    const url = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    name.value = 'Báo cáo';
    name.dispatchEvent(new Event('input'));
    url.value = '/bao-cao-thong-ke';
    url.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chưa có trang nào dùng đường dẫn này');

    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(service.tao).toHaveBeenCalledWith(
      expect.objectContaining({ ten: 'Báo cáo', url: '/bao-cao-thong-ke' }),
    );
  });

  it('rejects a URL that is neither an internal path nor an http(s) address', () => {
    fixture.componentInstance.batDauTao();
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('input[name="ten"]') as HTMLInputElement;
    const url = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    name.value = 'Sai định dạng';
    name.dispatchEvent(new Event('input'));
    url.value = 'bao-cao';
    url.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Đường dẫn phải bắt đầu bằng');

    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(service.tao).not.toHaveBeenCalled();
  });

  it('renders each row action as a bordered button with an icon, not bare text', () => {
    const actions = fixture.nativeElement.querySelectorAll(
      'tbody tr:first-child button.nut-hanh-dong',
    ) as NodeListOf<HTMLButtonElement>;

    expect(actions).toHaveLength(3);
    for (const nut of Array.from(actions)) {
      expect(nut.tagName).toBe('BUTTON');
      expect(nut.querySelector('.material-icons')).not.toBeNull();
    }
    expect(actions[0].textContent).toContain('Sửa');
    expect(actions[2].textContent).toContain('Xóa');
  });

  it('requires confirmation before deleting a menu entry', () => {
    fixture.nativeElement.querySelector('button[aria-label="Xóa menu Báo cáo"]').click();
    fixture.detectChanges();

    expect(service.xoa).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Xóa mục menu?');

    fixture.nativeElement.querySelector('.dialog .nut-nguy-hiem').click();

    expect(service.xoa).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.menuCanXoa()).toBeNull();
  });
});
