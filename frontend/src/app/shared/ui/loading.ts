import { Component, computed, input } from '@angular/core';

/**
 * Khung xương khi đang tải.
 *
 * Vì sao dùng skeleton thay spinner: skeleton giữ đúng kích thước nội dung
 * sắp hiện, nên trang không bị nhảy layout khi dữ liệu về.
 */
@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  template: `
    <div
      class="khoi"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="radius()"
      aria-hidden="true"
    ></div>
  `,
  styles: `
    .khoi {
      background: linear-gradient(
        90deg,
        var(--color-surface-alt) 25%,
        var(--color-border-soft) 37%,
        var(--color-surface-alt) 63%
      );
      background-size: 400% 100%;
      animation: chay 1.4s ease infinite;
    }

    @keyframes chay {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }

    /* Người dùng bật giảm chuyển động thì dừng animation, giữ khối tĩnh. */
    @media (prefers-reduced-motion: reduce) {
      .khoi {
        animation: none;
      }
    }
  `,
})
export class SkeletonBlock {
  readonly width = input('100%');
  readonly height = input('14px');
  readonly radius = input('var(--radius-sm)');
}

/**
 * Trạng thái đang tải có nhãn — dùng khi skeleton không hợp (ví dụ nút
 * trong dialog đang xử lý).
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="dang-tai" [style.padding]="padding()">
      <span class="vong" aria-hidden="true"></span>
      <span>{{ label() }}</span>
    </div>
  `,
  styles: `
    .dang-tai {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      color: var(--color-ink-muted);
      font-size: var(--text-small);
    }

    .vong {
      width: 16px;
      height: 16px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: quay 700ms linear infinite;
    }

    @keyframes quay {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .vong {
        animation-duration: 2.4s;
      }
    }
  `,
})
export class LoadingState {
  readonly label = input('Đang tải…');
  readonly padding = input('32px 16px');
}
