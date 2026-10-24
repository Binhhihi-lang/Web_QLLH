import { Component, computed, input } from '@angular/core';

export type BadgeSac = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Nhãn trạng thái theo màu ngữ nghĩa.
 *
 * Ánh xạ trạng thái DB → màu nằm ở ĐÂY, không rải trong từng màn hình: nhờ vậy
 * "OPEN" luôn cùng một màu xanh ở mọi bảng, và đổi quy ước chỉ sửa một chỗ.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'sac-' + mau()">{{ label() || value() }}</span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 9px;
      border-radius: var(--radius-sm);
      font-size: var(--text-caption);
      font-weight: 600;
      line-height: 1.6;
      white-space: nowrap;
    }

    .sac-success {
      background: var(--color-success-soft);
      color: var(--color-on-success-soft);
    }

    .sac-warning {
      background: var(--color-warning-soft);
      color: var(--color-on-warning-soft);
    }

    .sac-danger {
      background: var(--color-danger-soft);
      color: var(--color-on-danger-soft);
    }

    .sac-info {
      background: var(--color-info-soft);
      color: var(--color-on-info-soft);
    }

    .sac-neutral {
      background: var(--color-surface-alt);
      color: var(--color-ink-muted);
    }
  `,
})
export class StatusBadge {
  /** Nhãn hiển thị. Không truyền thì hiện chính `value`. */
  readonly label = input<string>('');
  /** Giá trị trạng thái thô từ API, dùng để suy ra màu. */
  readonly value = input<string>('');
  /** Ép màu, bỏ qua ánh xạ tự động. */
  readonly mauEp = input<BadgeSac | null>(null, { alias: 'mau' });

  private static readonly ANH_XA: Record<string, BadgeSac> = {
    // Trạng thái hoạt động
    ACTIVE: 'success',
    INACTIVE: 'neutral',
    // Lớp học phần
    OPEN: 'success',
    CLOSED: 'neutral',
    CANCELLED: 'danger',
    // Học kỳ
    UPCOMING: 'info',
    REGISTERING: 'warning',
    ONGOING: 'success',
    // Điểm danh
    CO_MAT: 'success',
    VANG_CO_PHEP: 'warning',
    VANG_KHONG_PHEP: 'danger',
    TRE: 'warning',
    // Điểm
    DAT: 'success',
    KHONG_DAT: 'danger',
    DA_CHOT: 'info',
    CHUA_CHOT: 'neutral',
  };

  readonly mau = computed<BadgeSac>(
    () => this.mauEp() ?? StatusBadge.ANH_XA[this.value()] ?? 'neutral',
  );
}
