import { Component, input } from '@angular/core';

/**
 * Trạng thái rỗng — danh sách không có dữ liệu.
 *
 * Có CTA tuỳ chọn: danh sách rỗng do CHƯA CÓ dữ liệu thì nên mời tạo mới;
 * rỗng do LỌC không khớp thì nên mời xoá bộ lọc. Ép cùng một thông điệp cho
 * cả hai trường hợp là lỗi hay gặp.
 *
 * `icon` nhận **tên icon Material** (`inbox`, `search_off`, `warning`), không
 * nhận ký tự Unicode: ký tự như `▤` hay `⚠` render khác nhau theo font của
 * từng máy, có máy ra ô vuông rỗng.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="rong">
      <span class="material-icons ic" aria-hidden="true">{{ icon() }}</span>
      <h4>{{ title() }}</h4>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      <div class="cta"><ng-content /></div>
    </div>
  `,
  styles: `
    .rong {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 44px 20px;
      color: var(--color-ink-muted);
    }

    .ic {
      font-size: 34px;
      line-height: 1;
      margin-bottom: 12px;
      opacity: 0.45;
      color: var(--color-ink-muted);
    }

    h4 {
      font-size: var(--text-h3);
      font-weight: 600;
      color: var(--color-ink);
      margin-bottom: 4px;
    }

    p {
      margin: 0;
      font-size: var(--text-small);
      max-width: 380px;
      line-height: 1.6;
    }

    .cta:not(:has(*)) {
      display: none;
    }

    .cta:has(*) {
      margin-top: 14px;
    }
  `,
})
export class EmptyState {
  readonly title = input('Không có dữ liệu');
  readonly description = input<string>('');
  readonly icon = input('inbox');
}
