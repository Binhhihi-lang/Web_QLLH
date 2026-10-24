import { Component, input } from '@angular/core';

/**
 * Footer của khung ứng dụng.
 *
 * Giữ mảnh: hệ quản trị dùng hằng ngày, footer to sẽ chiếm chỗ của dữ liệu.
 * Chỉ để phiên bản, thời điểm và một lối liên hệ khi cần.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>© 2026 Hệ thống quản lý lớp học</span>
      <span class="vach">·</span>
      <span>Phiên bản {{ phienBan() }}</span>
      <span class="cach"></span>
      <a href="mailto:hotro@university.edu.vn">Liên hệ hỗ trợ</a>
    </footer>
  `,
  styles: `
    .footer {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 10px 20px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      font-size: 12px;
      color: var(--color-ink-subtle);
      flex: none;
    }

    .vach {
      color: var(--color-border);
    }

    .cach {
      flex: 1;
    }

    a {
      color: var(--color-ink-muted);
      text-decoration: none;
    }

    a:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .footer {
        font-size: 11.5px;
        padding: 9px 14px;
      }

      .vach {
        display: none;
      }
    }
  `,
})
export class AppFooter {
  readonly phienBan = input('0.1.0');
}
