import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface MucMenu {
  nhan: string;
  duong_dan: string;
  icon: string;
  /** Vai trò được thấy mục này. Rỗng = mọi vai trò. */
  vai_tro?: string[];
}

export interface NhomMenu {
  tieu_de: string;
  muc: MucMenu[];
}

/**
 * Sidebar điều hướng.
 *
 * Nhóm menu khai báo ở ĐÂY chứ không lấy từ API như SCR-47 (quản lý menu):
 * dự án có 10 tuần, menu động là hạng mục Should. Khi backend có `/api/menus`
 * thì thay nguồn dữ liệu, phần render giữ nguyên.
 *
 * Lọc theo vai trò ngay tại component để màn ADMIN không thấy mục của STUDENT.
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

      <nav class="menu">
        @for (nhom of nhomHienThi(); track nhom.tieu_de) {
          <div class="nhom">
            @if (!thuGon()) {
              <div class="nhom-tieu-de">{{ nhom.tieu_de }}</div>
            }
            @for (muc of nhom.muc; track muc.duong_dan) {
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
            }
          </div>
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
  readonly hocKy = input('Học kỳ 1 · 2025-2026');
  readonly vaiTro = input('ADMIN');

  readonly chonMuc = output<MucMenu>();

  readonly thuGon = signal(false);

  private readonly CAY_MENU: NhomMenu[] = [
    {
      tieu_de: 'Tổng quan',
      muc: [{ nhan: 'Dashboard', duong_dan: '/dashboard', icon: 'dashboard' }],
    },
    {
      tieu_de: 'Đào tạo',
      muc: [
        { nhan: 'Sinh viên', duong_dan: '/sinh-vien', icon: 'school' },
        { nhan: 'Giảng viên', duong_dan: '/giang-vien', icon: 'person' },
        { nhan: 'Lớp hành chính', duong_dan: '/lop-hanh-chinh', icon: 'groups' },
        { nhan: 'Môn học', duong_dan: '/mon-hoc', icon: 'menu_book' },
        { nhan: 'Học kỳ', duong_dan: '/hoc-ky', icon: 'date_range' },
        { nhan: 'Phòng học', duong_dan: '/phong-hoc', icon: 'meeting_room' },
      ],
    },
    {
      tieu_de: 'Học vụ',
      muc: [
        { nhan: 'Lớp học phần', duong_dan: '/lop-hoc-phan', icon: 'class' },
        { nhan: 'Đăng ký', duong_dan: '/dang-ky', icon: 'how_to_reg' },
        { nhan: 'Lịch học', duong_dan: '/lich-hoc', icon: 'calendar_month' },
        { nhan: 'Điểm danh', duong_dan: '/diem-danh', icon: 'fact_check' },
        { nhan: 'Điểm', duong_dan: '/diem', icon: 'grading' },
      ],
    },
    {
      tieu_de: 'Hệ thống',
      muc: [
        { nhan: 'Người dùng', duong_dan: '/nguoi-dung', icon: 'manage_accounts', vai_tro: ['ADMIN'] },
        { nhan: 'Cấu hình', duong_dan: '/cau-hinh', icon: 'settings', vai_tro: ['ADMIN'] },
        { nhan: 'Thùng rác', duong_dan: '/thung-rac', icon: 'delete', vai_tro: ['ADMIN'] },
      ],
    },
  ];

  readonly nhomHienThi = computed(() => {
    const vaiTro = this.vaiTro();
    return this.CAY_MENU.map((nhom) => ({
      ...nhom,
      muc: nhom.muc.filter((m) => !m.vai_tro || m.vai_tro.includes(vaiTro)),
    })).filter((nhom) => nhom.muc.length > 0);
  });

  doiThuGon(): void {
    this.thuGon.update((v) => !v);
  }
}
