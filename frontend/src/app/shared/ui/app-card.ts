import { Component, input } from '@angular/core';

/**
 * Khối nội dung 3 phần: đầu / thân / chân.
 *
 * Chân chỉ hiện khi có nội dung hành động — nếu luôn hiện thì mọi card đều
 * có một khoảng trống thừa ở đáy.
 */
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="card">
      @if (title()) {
        <div class="dau">
          <div>
            <h3>{{ title() }}</h3>
            @if (subtitle()) {
              <p>{{ subtitle() }}</p>
            }
          </div>
          <div class="dau-phai"><ng-content select="[cardActions]" /></div>
        </div>
      }
      <div class="than" [class.khong-dau]="!title()">
        <ng-content />
      </div>
      <div class="chan"><ng-content select="[cardFooter]" /></div>
    </div>
  `,
  styles: `
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .dau {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border-soft);
    }

    .dau h3 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
    }

    .dau p {
      margin: 3px 0 0;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    .than {
      padding: 16px;
    }

    .chan {
      padding: 0 16px;
      border-top: 1px solid var(--color-border-soft);
    }

    /* :empty không bắt được <ng-content>, nên ẩn chân bằng :has() —
       nếu không thì card không có hành động vẫn bị một vạch kẻ thừa ở đáy. */
    .chan:not(:has(*)) {
      display: none;
    }

    .chan:has(*) {
      padding: 12px 16px;
    }
  `,
})
export class AppCard {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
}
