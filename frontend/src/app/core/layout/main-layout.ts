import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AppFooter } from '@core/layout/footer';
import { Header } from '@core/layout/header';
import { MucMenu, Sidebar } from '@core/layout/sidebar';

/**
 * Khung ứng dụng cho mọi màn NGHIỆP VỤ.
 *
 * Trang đăng nhập / đăng ký / quên mật khẩu KHÔNG dùng layout này — chúng
 * đứng riêng toàn màn hình, vì hiện sidebar cho người chưa đăng nhập là vô
 * nghĩa và làm lộ cấu trúc hệ thống.
 *
 * Mobile: sidebar ẩn hẳn thành drawer, mở bằng nút menu ở header. Dùng lớp
 * phủ mờ để bấm ra ngoài là đóng.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, AppFooter],
  template: `
    <div class="khung">
      <!-- Lớp phủ chỉ tồn tại ở mobile khi drawer mở. -->
      @if (moDrawer()) {
        <div class="phu" (click)="dongDrawer()"></div>
      }

      <div class="sidebar-wrap" [class.mo]="moDrawer()">
        <app-sidebar
          [vaiTro]="'ADMIN'"
          (chonMuc)="khiChonMenu($event)"
        />
      </div>

      <div class="cot-phai">
        <app-header
          (moMenu)="moDrawer.set(true)"
          (hanhDong)="khiChonHanhDong($event)"
        />

        <main class="noi-dung">
          <router-outlet />
        </main>

        <app-footer />
      </div>
    </div>
  `,
  styles: `
    .khung {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-bg);
    }

    .sidebar-wrap {
      display: flex;
      flex: none;
      height: 100%;
    }

    .cot-phai {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      height: 100%;
    }

    .noi-dung {
      flex: 1;
      overflow-y: auto;
      padding: 22px 24px 28px;
    }

    .phu {
      display: none;
    }

    /* ---------- Mobile: sidebar thành drawer ---------- */
    @media (max-width: 900px) {
      .sidebar-wrap {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 60;
        transform: translateX(-100%);
        transition: transform var(--dur) var(--ease);
      }

      .sidebar-wrap.mo {
        transform: translateX(0);
        box-shadow: var(--shadow-lg);
      }

      .phu {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 55;
        background: rgba(15, 23, 42, 0.45);
      }

      .noi-dung {
        padding: 16px 14px 22px;
      }
    }
  `,
})
export class MainLayout {
  readonly moDrawer = signal(false);

  constructor(private readonly router: Router) {}

  /** Bấm menu ở mobile thì đóng drawer, nếu không nó che màn vừa mở. */
  khiChonMenu(_muc: MucMenu): void {
    this.moDrawer.set(false);
  }

  dongDrawer(): void {
    this.moDrawer.set(false);
  }

  khiChonHanhDong(hanhDong: 'ho-so' | 'doi-mat-khau' | 'dang-xuat'): void {
    switch (hanhDong) {
      case 'doi-mat-khau':
        void this.router.navigate(['/doi-mat-khau']);
        break;
      case 'dang-xuat':
        // Chưa có AuthService — khi nối backend sẽ gọi /api/auth/logout rồi
        // mới điều hướng. Hiện chỉ điều hướng để thấy luồng.
        void this.router.navigate(['/dang-nhap']);
        break;
      case 'ho-so':
        // Màn hồ sơ cá nhân chưa thuộc phạm vi tuần này.
        break;
    }
  }
}
