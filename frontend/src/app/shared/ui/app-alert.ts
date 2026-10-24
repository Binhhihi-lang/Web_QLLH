import { Component, input } from '@angular/core';

export type AlertMuc = 'success' | 'info' | 'warning' | 'danger';

/**
 * Hộp thông báo 4 mức.
 *
 * Icon dùng Material Icons (đã nạp trong index.html) thay vì ký tự Unicode
 * như ✓ ⓘ ⚠ — ký tự Unicode render khác nhau trên từng hệ điều hành, có máy
 * ra emoji màu, có máy ra ký tự mảnh. Font icon thì đồng nhất mọi nơi và
 * cùng bộ với icon trong menu, nút.
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <div class="alert" [class]="'muc-' + muc()" role="alert">
      <span class="material-icons ic" aria-hidden="true">{{ bieuTuong() }}</span>
      <div class="noi-dung">
        @if (title()) {
          <strong>{{ title() }}</strong>
        }
        <div class="than"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    .alert {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 11px 14px;
      border-radius: var(--radius);
      border-left: 3px solid;
      font-size: var(--text-small);
      line-height: 1.55;
    }

    .ic {
      font-size: 18px;
      line-height: 1;
      flex: none;
      margin-top: 1px;
    }

    .noi-dung {
      min-width: 0;
    }

    strong {
      display: block;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .than {
      color: inherit;
      opacity: 0.92;
    }

    .muc-success {
      background: var(--color-success-soft);
      border-left-color: var(--color-success);
      color: var(--color-on-success-soft);
    }

    .muc-info {
      background: var(--color-info-soft);
      border-left-color: var(--color-info);
      color: var(--color-on-info-soft);
    }

    .muc-warning {
      background: var(--color-warning-soft);
      border-left-color: var(--color-warning);
      color: var(--color-on-warning-soft);
    }

    .muc-danger {
      background: var(--color-danger-soft);
      border-left-color: var(--color-danger);
      color: var(--color-on-danger-soft);
    }
  `,
})
export class AppAlert {
  readonly muc = input<AlertMuc>('info');
  readonly title = input<string>('');

  private static readonly BIEU_TUONG: Record<AlertMuc, string> = {
    success: 'check_circle',
    info: 'info',
    warning: 'warning',
    danger: 'error',
  };

  bieuTuong(): string {
    return AppAlert.BIEU_TUONG[this.muc()];
  }
}
