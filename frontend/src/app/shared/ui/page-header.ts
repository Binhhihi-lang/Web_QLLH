import { Component, input } from '@angular/core';

/**
 * Đầu trang: tiêu đề + mô tả + vùng hành động bên phải.
 *
 * Tách thành component vì đây là khối lặp ở mọi màn danh sách. Nếu mỗi màn
 * tự viết thì cỡ chữ và khoảng cách sẽ lệch nhau chỉ sau vài tuần.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-h">
      <div class="trai">
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </div>
      <div class="phai"><ng-content /></div>
    </div>
  `,
  styles: `
    .page-h {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 18px;
    }

    h1 {
      font-size: var(--text-h1);
      font-weight: 600;
      color: var(--color-ink);
    }

    p {
      margin: 4px 0 0;
      font-size: var(--text-small);
      color: var(--color-ink-muted);
    }

    .phai {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .phai:not(:has(*)) {
      display: none;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
