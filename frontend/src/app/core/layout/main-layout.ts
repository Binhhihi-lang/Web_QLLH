import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AppFooter } from '@core/layout/footer';
import { Header } from '@core/layout/header';
import { MucMenu, Sidebar } from '@core/layout/sidebar';
import { AppAlert } from '@shared/ui/app-alert';

/**
 * Khung ứng dụng cho mọi màn NGHIỆP VỤ.
 *
 * Trang đăng nhập / đăng ký / quên mật khẩu KHÔNG dùng layout này — chúng
 * đứng riêng toàn màn hình
 *
 * Mobile: sidebar ẩn hẳn thành drawer, mở bằng nút menu ở header. Dùng lớp
 * phủ mờ để bấm ra ngoài là đóng.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header, AppFooter, AppAlert],
  template: `
    <div class="khung">
      <!-- Lớp phủ chỉ tồn tại ở mobile khi drawer mở. -->
      @if (moDrawer()) {
        <div class="phu" (click)="dongDrawer()"></div>
      }

      <div class="sidebar-wrap" [class.mo]="moDrawer()">
        <app-sidebar
          [vaiTro]="vaiTro()"
          (chonMuc)="khiChonMenu($event)"
        />
      </div>

      <div class="cot-phai">
        <app-header
          [hoTen]="nguoiDung()?.name ?? ''"
          [email]="nguoiDung()?.email ?? ''"
          [vaiTro]="nguoiDung()?.vai_tro ?? ''"
          (moMenu)="moDrawer.set(true)"
          (hanhDong)="khiChonHanhDong($event)"
        />

        <main class="noi-dung">
          @if (loi()) {
            <app-alert muc="danger" title="Không thể hoàn tất thao tác">{{ loi() }}</app-alert>
          }
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly moDrawer = signal(false);
  readonly loi = signal<string | null>(null);
  readonly nguoiDung = this.auth.nguoiDung;
  readonly vaiTro = computed(() => this.nguoiDung()?.vai_tro ?? '');

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
        this.loi.set(null);
        this.auth.dangXuat().subscribe({
          next: () => void this.router.navigate(['/dang-nhap']),
          error: (loi: unknown) => this.loi.set(this.thongBaoLoi(loi)),
        });
        break;
      case 'ho-so':
        // Màn hồ sơ cá nhân chưa thuộc phạm vi tuần này.
        break;
    }
  }

  private thongBaoLoi(loi: unknown): string {
    if (!(loi instanceof HttpErrorResponse)) return 'Không thể đăng xuất lúc này. Vui lòng thử lại.';
    return loi.error?.message ?? 'Máy chủ không thể hoàn tất yêu cầu đăng xuất.';
  }
}
