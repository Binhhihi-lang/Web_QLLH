import { Component, input } from '@angular/core';
import { EmptyState } from '@shared/ui/empty-state';
import { PageHeader } from '@shared/ui/page-header';

/**
 * Trang giữ chỗ cho màn hình chưa làm.
 *
 * Vì sao cần: sidebar khai đủ 14 mục ngay từ đầu, nhưng chỉ vài màn đã có route.
 * Thiếu trang giữ chỗ thì bấm vào mục chưa làm sẽ rơi vào route `**` và lặng lẽ
 * nhảy về dashboard — người dùng tưởng nút hỏng, người phát triển tưởng route
 * sai. Trang này nói rõ màn nào, ai làm, thuộc tuần nào.
 *
 * Khi làm xong màn thật thì thay `loadComponent` trong file route của nhóm.
 */
@Component({
  selector: 'app-dang-xay-dung',
  standalone: true,
  imports: [EmptyState, PageHeader],
  template: `
    <app-page-header [title]="title()" [description]="moTa()" />
    <div class="khung">
      <app-empty-state
        icon="construction"
        [title]="'Màn hình ' + ma() + ' chưa làm'"
        [description]="chiTiet()"
      />
    </div>
  `,
  styles: `
    .khung {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }
  `,
})
export class DangXayDung {
  /** Mã màn hình theo docs/05-screens.md, ví dụ `SCR-13`. */
  readonly ma = input('SCR-??');
  readonly title = input('Đang xây dựng');
  readonly moTa = input('');
  readonly chiTiet = input('Màn hình này nằm trong kế hoạch, xem docs/phan-cong-cong-viec.md để biết ai làm và tuần nào.');
}
