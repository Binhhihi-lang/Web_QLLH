import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuApi, MenuService } from '@core/services/menu.service';
import { routes } from '../../../app.routes';
import { MenuChiTiet } from './chi-tiet';

describe('MenuChiTiet', () => {
  const menu: MenuApi = {
    id: 1,
    ten: 'Giới thiệu',
    url: '/gioi-thieu',
    vi_tri: 'sidebar',
    nhom: 'Thông tin',
    vai_tro: null,
    thu_tu: 1,
    trang_thai: true,
  };

  function taoFixture(editMode = false) {
    const service = {
      layMot: vi.fn(() => of(menu)),
      capNhat: vi.fn((id: number, input: Omit<MenuApi, 'id'>) => of({ id, ...input })),
    };
    TestBed.configureTestingModule({
      imports: [MenuChiTiet],
      providers: [
        provideRouter(routes),
        { provide: ActivatedRoute, useValue: { snapshot: {
          paramMap: { get: () => '1' },
          data: editMode ? { editMode: true } : {},
        } } },
        { provide: MenuService, useValue: service },
      ],
    });
    const fixture = TestBed.createComponent(MenuChiTiet);
    fixture.detectChanges();
    return { fixture, service };
  }

  it('shows menu details on a dedicated page without navigating to its configured URL', () => {
    const { fixture } = taoFixture();

    expect(fixture.nativeElement.textContent).toContain('Giới thiệu');
    expect(fixture.nativeElement.textContent).toContain('/gioi-thieu');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('saves edits from the dedicated edit page and returns to menu details', () => {
    const { fixture, service } = taoFixture(true);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const nameInput = fixture.nativeElement.querySelector('input[name="ten"]') as HTMLInputElement;
    nameInput.value = 'Giới thiệu mới';
    nameInput.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ten: 'Giới thiệu mới', url: '/gioi-thieu' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/menu', 1]);
  });

  it('saves an edit whose page does not exist yet but warns about the placeholder page', () => {
    const { fixture, service } = taoFixture(true);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlInput = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    urlInput.value = '/bao-cao-thong-ke';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chưa có trang nào dùng đường dẫn này');

    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );

    expect(service.capNhat).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ url: '/bao-cao-thong-ke' }),
    );
  });

  it('warns and prevents saving an edit with a malformed URL', () => {
    const { fixture, service } = taoFixture(true);
    const urlInput = fixture.nativeElement.querySelector('input[name="url"]') as HTMLInputElement;
    urlInput.value = 'khong-co-gach-cheo';
    urlInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Đường dẫn phải bắt đầu bằng');

    fixture.nativeElement.querySelector('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(service.capNhat).not.toHaveBeenCalled();
  });
});
