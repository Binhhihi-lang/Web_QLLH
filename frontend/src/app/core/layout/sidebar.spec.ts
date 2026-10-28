import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MenuService } from '@core/services/menu.service';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Sidebar>>;
  let menuService: {
    layMenuSidebar: ReturnType<typeof vi.fn>;
    phienBan: ReturnType<typeof signal<number>>;
  };

  const menus = [
    {
      id: 1,
      ten: 'Lớp học phần',
      url: '/lop-hoc-phan',
      vi_tri: 'sidebar' as const,
      nhom: 'Học vụ',
      vai_tro: null,
      thu_tu: 10,
      trang_thai: true,
    },
    {
      id: 2,
      ten: 'Người dùng',
      url: '/nguoi-dung',
      vi_tri: 'sidebar' as const,
      nhom: 'Hệ thống',
      vai_tro: ['ADMIN'] as const,
      thu_tu: 30,
      trang_thai: true,
    },
    {
      id: 3,
      ten: 'Đăng ký',
      url: '/dang-ky',
      vi_tri: 'sidebar' as const,
      nhom: 'Học vụ',
      vai_tro: ['SINH_VIEN'] as const,
      thu_tu: 12,
      trang_thai: true,
    },
    {
      id: 4,
      ten: 'Tài liệu',
      url: 'https://example.com/huong-dan',
      vi_tri: 'sidebar' as const,
      nhom: 'Hỗ trợ',
      vai_tro: null,
      thu_tu: 40,
      trang_thai: true,
    },
  ];

  beforeEach(() => {
    menuService = { layMenuSidebar: vi.fn(() => of(menus)), phienBan: signal(0) };
    TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), { provide: MenuService, useValue: menuService }],
    });
    fixture = TestBed.createComponent(Sidebar);
    fixture.componentRef.setInput('vaiTro', 'ADMIN');
  });

  it('renders menu groups and entries supplied by the API for the current role', () => {
    fixture.detectChanges();

    expect(menuService.layMenuSidebar).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Học vụ');
    expect(fixture.nativeElement.textContent).toContain('Lớp học phần');
    expect(fixture.nativeElement.textContent).toContain('Người dùng');
    const externalLink = fixture.nativeElement.querySelector(
      'a[href="https://example.com/huong-dan"]',
    );
    expect(externalLink.getAttribute('target')).toBe('_blank');
    expect(externalLink.getAttribute('rel')).toContain('noopener');
  });

  it('shows ADMIN entries to ADMIN but hides entries scoped only to other roles', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Người dùng');

    // Fixture gắn "Đăng ký" chỉ cho SINH_VIEN. ADMIN không có hồ sơ sinh viên,
    // nên mục cá nhân của sinh viên cũng phải ẩn với ADMIN.
    expect(fixture.nativeElement.textContent).not.toContain('Đăng ký');
  });

  it('shows an entry shared between several roles to each of them', () => {
    menuService.layMenuSidebar.mockReturnValue(
      of([
        {
          id: 9,
          ten: 'Điểm danh',
          url: '/diem-danh',
          vi_tri: 'sidebar' as const,
          nhom: 'Học vụ',
          vai_tro: ['ADMIN', 'GIANG_VIEN'] as const,
          thu_tu: 13,
          trang_thai: true,
        },
      ]),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Điểm danh');

    fixture.componentRef.setInput('vaiTro', 'GIANG_VIEN');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Điểm danh');

    fixture.componentRef.setInput('vaiTro', 'SINH_VIEN');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Điểm danh');
  });

  it('hides entries scoped to another role for a non-admin', () => {
    fixture.componentRef.setInput('vaiTro', 'GIANG_VIEN');
    fixture.detectChanges();

    // Fixture gắn "Đăng ký" cho SINH_VIEN và "Người dùng" cho ADMIN.
    expect(fixture.nativeElement.textContent).not.toContain('Đăng ký');
    expect(fixture.nativeElement.textContent).not.toContain('Người dùng');
    expect(fixture.nativeElement.textContent).toContain('Lớp học phần');
  });

  it('hides ADMIN-only entries from a student', () => {
    fixture.componentRef.setInput('vaiTro', 'SINH_VIEN');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Người dùng');
    expect(fixture.nativeElement.textContent).toContain('Lớp học phần');
  });

  it('shows a retry action when loading fails and reloads the menu when retried', () => {
    menuService.layMenuSidebar
      .mockReturnValueOnce(throwError(() => new Error('API không khả dụng')))
      .mockReturnValueOnce(of(menus));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Không tải được menu');
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(menuService.layMenuSidebar).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Lớp học phần');
  });

  it('reloads the sidebar when an admin changes menu data', () => {
    const updatedMenus = [...menus, { ...menus[0], id: 4, ten: 'Báo cáo' }];
    menuService.layMenuSidebar
      .mockReturnValueOnce(of(menus))
      .mockReturnValueOnce(of(updatedMenus));
    fixture.detectChanges();

    menuService.phienBan.set(1);
    fixture.detectChanges();

    expect(menuService.layMenuSidebar).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Báo cáo');
  });
});
