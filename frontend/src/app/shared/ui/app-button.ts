import { Component, input } from '@angular/core';

export type NutBienThe = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
export type NutCo = 'sm' | 'md';

/**
 * Nút dùng chung. Quy ước: mỗi vùng nhìn chỉ MỘT nút primary — nhiều nút
 * primary cạnh nhau thì người dùng không biết bấm cái nào.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="classes()"
    >
      @if (loading()) {
        <span class="nut-loading" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: var(--radius);
      border: 1.5px solid transparent;
      font-family: var(--font-body);
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color var(--dur) var(--ease),
        border-color var(--dur) var(--ease),
        color var(--dur) var(--ease);
      white-space: nowrap;
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* ---- Kích cỡ ---- */
    .co-sm {
      font-size: 13px;
      padding: 6px 12px;
    }

    .co-md {
      font-size: 14.5px;
      padding: 10px 18px;
    }

    /* ---- Biến thể ---- */
    .bt-primary {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .bt-primary:hover:not(:disabled) {
      background: var(--color-primary-hover);
    }

    .bt-secondary {
      background: var(--color-surface);
      color: var(--color-ink);
      border-color: var(--color-border);
    }

    .bt-secondary:hover:not(:disabled) {
      background: var(--color-surface-alt);
      border-color: var(--color-ink-subtle);
    }

    .bt-ghost {
      background: transparent;
      color: var(--color-primary);
      border-color: transparent;
    }

    .bt-ghost:hover:not(:disabled) {
      background: var(--color-primary-soft);
    }

    .bt-danger {
      background: var(--color-danger);
      color: var(--color-on-primary);
    }

    .bt-danger:hover:not(:disabled) {
      background: var(--color-danger-hover);
    }

    .bt-text {
      background: transparent;
      color: var(--color-ink-muted);
      padding-left: 6px;
      padding-right: 6px;
    }

    .bt-text:hover:not(:disabled) {
      color: var(--color-primary);
    }

    /* Vòng xoay khi đang gửi — báo hiệu thao tác đang chạy. */
    .nut-loading {
      width: 13px;
      height: 13px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: quay 640ms linear infinite;
    }

    @keyframes quay {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .nut-loading {
        animation-duration: 2s;
      }
    }
  `,
})
export class AppButton {
  readonly variant = input<NutBienThe>('primary');
  readonly size = input<NutCo>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);

  classes() {
    return `co-${this.size()} bt-${this.variant()}`;
  }
}
