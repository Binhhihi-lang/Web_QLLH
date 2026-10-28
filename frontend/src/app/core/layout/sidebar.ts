import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MucMenu } from '../../routes/dao-tao.menu';
import { MenuApi, MenuService } from '@core/services/menu.service';
import { vaiTroDuocThayMenu } from '@core/utils/menu-vai-tro';

export type { MucMenu, NhomMenu } from '../../routes/dao-tao.menu';

/**
 * Sidebar điều hướng.
 *
 * Menu đang hoạt động được tải từ API; vai trò được lọc ở backend và kiểm tra
 * lại tại component để menu giả lập cũng tuân theo cùng quy tắc.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.thu-gon]="thuGon()">
      <div class="brand">
        <div class="logo">Q</div>
        @if (!thuGon()) {
          <div class="ten">
            Quản lý lớp học
            <small>{{ hocKy() }}</small>
          </div>
        }
      </div>

      <nav class="menu" aria-label="Điều hướng chính" [attr.aria-busy]="dangTai()">
        @if (dangTai()) {
          <p class="trang-thai" role="status">Đang tải menu…</p>
        } @else if (loi()) {
          <div class="loi-menu" role="alert">
            <p>{{ loi() }}</p>
            <button type="button" (click)="taiMenu()">Thử lại</button>
          </div>
        } @else if (nhomHienThi().length === 0) {
          <p class="trang-thai" role="status">Chưa có mục menu nào.</p>
        } @else {
          @for (nhom of nhomHienThi(); track nhom.tieu_de) {
            <div class="nhom">
              @if (!thuGon()) {
                <div class="nhom-tieu-de">{{ nhom.tieu_de }}</div>
              }
              @for (muc of nhom.muc; track muc.duong_dan) {
                @if (laUrlNoiBo(muc.duong_dan)) {
                  <a
                    [routerLink]="muc.duong_dan"
                    routerLinkActive="active"
                    [title]="thuGon() ? muc.nhan : ''"
                    (click)="chonMuc.emit(muc)"
                  >
                    <span class="material-icons ic">{{ muc.icon }}</span>
                    @if (!thuGon()) {
                      <span class="nhan">{{ muc.nhan }}</span>
                    }
                  </a>
                } @else {
                  <a
                    [href]="muc.duong_dan"
                    target="_blank"
                    rel="noopener noreferrer"
                    [title]="thuGon() ? muc.nhan + ' · Mở trong tab mới' : 'Mở trong tab mới'"
                    (click)="chonMuc.emit(muc)"
                  >
                    <span class="material-icons ic">{{ muc.icon }}</span>
                    @if (!thuGon()) {
                      <span class="nhan">{{ muc.nhan }}</span>
                    }
                  </a>
                  }
                }
            </div>
          }
        }
      </nav>

      <div class="cuoi">
        <button type="button" class="thu-gon-nut" (click)="doiThuGon()">
          <span class="material-icons">{{ thuGon() ? 'chevron_right' : 'chevron_left' }}</span>
          @if (!thuGon()) {
            <span>Thu gọn</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: `
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 250px;
      height: 100%;
      background: linear-gradient(180deg, var(--color-sidebar-top) 0%, var(--color-sidebar-bottom) 100%);
      color: var(--color-sidebar-item);
      transition: width var(--dur) var(--ease);
      flex: none;
      overflow: hidden;
    }

    .sidebar.thu-gon {
      width: 64px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 18px 16px;
      border-bottom: 1px solid var(--color-sidebar-line);
      flex: none;
    }

    .logo {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      flex: none;
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 15px;
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .ten {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 14px;
      line-height: 1.3;
      color: #ffffff;
      white-space: nowrap;
    }

    .ten small {
      display: block;
      font-family: var(--font-body);
      font-weight: 400;
      font-size: 11px;
      color: var(--color-sidebar-icon);
    }

    .menu {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0 12px;
    }

    .menu::-webkit-scrollbar {
      width: 5px;
    }

    .menu::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.16);
      border-radius: 3px;
    }

    .trang-thai,
    .loi-menu {
      margin: 12px 10px;
      padding: 10px;
      color: var(--color-sidebar-icon);
      font-size: 12px;
      line-height: 1.5;
    }

    .loi-menu {
      color: #ffffff;
    }

    .loi-menu p {
      margin: 0 0 8px;
    }

    .loi-menu button {
      padding: 5px 8px;
      border: 1px solid var(--color-sidebar-line);
      border-radius: var(--radius);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .nhom {
      padding: 10px 10px 0;
    }

    .nhom-tieu-de {
      padding: 8px 10px 6px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--color-sidebar-label);
      white-space: nowrap;
    }

    a {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 9px 11px;
      border-radius: var(--radius);
      color: var(--color-sidebar-item);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      white-space: nowrap;
      transition: background var(--dur-fast) var(--ease);
    }

    a:hover {
      background: var(--color-sidebar-hover);
    }

    a.active {
      background: var(--color-sidebar-active-bg);
      color: var(--color-sidebar-active-fg);
      font-weight: 600;
    }

    .ic {
      font-size: 19px;
      width: 19px;
      flex: none;
      color: var(--color-sidebar-icon);
    }

    a.active .ic {
      color: var(--color-sidebar-active-fg);
    }

    .thu-gon a {
      justify-content: center;
      padding: 9px;
    }

    .cuoi {
      flex: none;
      border-top: 1px solid var(--color-sidebar-line);
      padding: 8px;
    }

    .thu-gon-nut {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: var(--radius);
      background: transparent;
      color: var(--color-sidebar-icon);
      font-family: var(--font-body);
      font-size: 12.5px;
      cursor: pointer;
    }

    .thu-gon-nut:hover {
      background: var(--color-sidebar-hover);
      color: #ffffff;
    }

    .thu-gon-nut .material-icons {
      font-size: 18px;
    }
  `,
})
export class Sidebar {
  private readonly menuService = inject(MenuService);
  private readonly taiLaiMenuKhiThayDoi = effect(() => {
    this.menuService.phienBan();
    this.taiMenu();
  });

  readonly hocKy = input('Học kỳ 1 · 2025-2026');
  readonly vaiTro = input('ADMIN');

  readonly chonMuc = output<MucMenu>();

  readonly thuGon = signal(false);
  private readonly menus = signal<MenuApi[]>([]);
  readonly dangTai = signal(true);
  readonly loi = signal<string | null>(null);

  readonly nhomHienThi = computed(() => {
    const vaiTro = this.vaiTro();
    const nhomTheoTen = new Map<string, MucMenu[]>();

    for (const menu of this.menus()) {
      if (!vaiTroDuocThayMenu(vaiTro, menu.vai_tro)) continue;

      const tenNhom = menu.nhom?.trim() || 'Khác';
      const mucNhom = nhomTheoTen.get(tenNhom) ?? [];
      mucNhom.push({
        nhan: menu.ten,
        duong_dan: menu.url,
        icon: this.iconCho(menu.url),
        ...(menu.vai_tro && menu.vai_tro.length > 0 ? { vai_tro: menu.vai_tro } : {}),
      });
      nhomTheoTen.set(tenNhom, mucNhom);
    }

    return [...nhomTheoTen].map(([tieu_de, muc]) => ({ tieu_de, muc }));
  });

  taiMenu(): void {
    this.dangTai.set(true);
    this.loi.set(null);
    this.menuService.layMenuSidebar().subscribe({
      next: (menus) => {
        this.menus.set(menus);
        this.dangTai.set(false);
      },
      error: () => {
        this.loi.set('Không tải được menu. Kiểm tra kết nối rồi thử lại.');
        this.dangTai.set(false);
      },
    });
  }

  doiThuGon(): void {
    this.thuGon.update((v) => !v);
  }

  laUrlNoiBo(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//');
  }

  private iconCho(url: string): string {
    return (
      {
        '/dashboard': 'dashboard',
        '/lop-hoc-phan': 'class',
        '/lich-hoc': 'calendar_month',
        '/dang-ky': 'how_to_reg',
        '/dang-ky-cua-toi': 'how_to_reg',
        '/diem-danh': 'fact_check',
        '/diem': 'grading',
        '/diem-cua-toi': 'grade',
        '/sinh-vien': 'school',
        '/giang-vien': 'person',
        '/lop-hanh-chinh': 'groups',
        '/mon-hoc': 'menu_book',
        '/hoc-ky': 'date_range',
        '/phong-hoc': 'meeting_room',
        '/nguoi-dung': 'manage_accounts',
        '/menu': 'menu',
        '/cau-hinh': 'settings',
        '/nhat-ky': 'history',
        '/thung-rac': 'delete',
        '/tai-khoan': 'account_circle',
      }[url] ?? 'apps'
    );
  }
}
